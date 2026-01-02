-- ============================================
-- FINAL FIX: Break Infinite Recursion & Fix Storage
-- ============================================

-- 1. Create Helper Functions (SECURITY DEFINER to bypass RLS)
-- These functions run with system privileges, so they don't trigger RLS loops.

-- Function to get project owner ID
CREATE OR REPLACE FUNCTION get_project_owner(p_id UUID)
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT user_id FROM projects WHERE id = p_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is an editor/owner of a project
CREATE OR REPLACE FUNCTION is_project_editor(p_id UUID, u_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if user is owner
    IF EXISTS (SELECT 1 FROM projects WHERE id = p_id AND user_id = u_id) THEN
        RETURN TRUE;
    END IF;
    
    -- Check if user is an editor collaborator
    IF EXISTS (
        SELECT 1 FROM project_collaborators 
        WHERE project_id = p_id 
        AND user_id = u_id 
        AND role IN ('owner', 'editor')
    ) THEN
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Fix 'project_collaborators' Policies (Break the Loop)
-- We replace the direct query to 'projects' with the security definer function.

DROP POLICY IF EXISTS "Users can view collaborators of their projects" ON project_collaborators;
DROP POLICY IF EXISTS "Project owners can add collaborators" ON project_collaborators;
DROP POLICY IF EXISTS "Project owners can remove collaborators" ON project_collaborators;

CREATE POLICY "Users can view collaborators"
    ON project_collaborators FOR SELECT
    USING (
        -- User is the collaborator
        user_id = auth.uid()
        OR
        -- User is the project owner (using function to avoid recursion)
        get_project_owner(project_id) = auth.uid()
    );

CREATE POLICY "Project owners can manage collaborators"
    ON project_collaborators FOR ALL
    USING (
        -- Only project owner can add/remove/update
        get_project_owner(project_id) = auth.uid()
    );

-- 3. Fix 'projects' Policies (Just to be safe)

DROP POLICY IF EXISTS "Users can view their own and collaborated projects" ON projects;
DROP POLICY IF EXISTS "Users can update their own and collaborated projects" ON projects;

CREATE POLICY "Users can view projects"
    ON projects FOR SELECT
    USING (
        user_id = auth.uid()
        OR
        EXISTS (
            SELECT 1 FROM project_collaborators pc 
            WHERE pc.project_id = projects.id 
            AND pc.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update projects"
    ON projects FOR UPDATE
    USING (
        user_id = auth.uid()
        OR
        EXISTS (
            SELECT 1 FROM project_collaborators pc 
            WHERE pc.project_id = projects.id 
            AND pc.user_id = auth.uid()
            AND pc.role IN ('owner', 'editor')
        )
    );

-- 4. Fix Storage Policies (Allow Collaborators to Upload)

DROP POLICY IF EXISTS "Users can upload their own model files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own model files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own model files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view all model files" ON storage.objects;

-- Policy: Upload (Insert)
CREATE POLICY "Users can upload model files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'model-files' AND
    (
        -- Option 1: User is the owner (folder name matches user ID)
        (storage.foldername(name))[1] = auth.uid()::text
        OR
        -- Option 2: User is an editor of the project (folder name is owner ID, but user is editor)
        is_project_editor(
            (storage.foldername(name))[2]::uuid, -- Project ID from path
            auth.uid()
        )
    )
);

-- Policy: Update
CREATE POLICY "Users can update model files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'model-files' AND
    (
        (storage.foldername(name))[1] = auth.uid()::text
        OR
        is_project_editor((storage.foldername(name))[2]::uuid, auth.uid())
    )
);

-- Policy: Delete
CREATE POLICY "Users can delete model files"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'model-files' AND
    (
        (storage.foldername(name))[1] = auth.uid()::text
        OR
        is_project_editor((storage.foldername(name))[2]::uuid, auth.uid())
    )
);

-- Policy: View (Read) - Allow all authenticated users to read (simplest for collaboration)
CREATE POLICY "Users can view model files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'model-files');
