-- ============================================
-- FIX: Allow Collaborators to Access Projects
-- ============================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
DROP POLICY IF EXISTS "Users can insert their own projects" ON projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;

-- Enable RLS on projects table
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Allow users to view projects they own OR are collaborators on
CREATE POLICY "Users can view their own and collaborated projects"
    ON projects FOR SELECT
    USING (
        -- User is the owner
        user_id = auth.uid()
        OR
        -- User is a collaborator
        EXISTS (
            SELECT 1 FROM project_collaborators pc 
            WHERE pc.project_id = projects.id 
            AND pc.user_id = auth.uid()
        )
    );

-- Allow users to create projects
CREATE POLICY "Users can create projects"
    ON projects FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Allow users to update projects they own OR are collaborators on
CREATE POLICY "Users can update their own and collaborated projects"
    ON projects FOR UPDATE
    USING (
        -- User is the owner
        user_id = auth.uid()
        OR
        -- User is a collaborator (editor role)
        EXISTS (
            SELECT 1 FROM project_collaborators pc 
            WHERE pc.project_id = projects.id 
            AND pc.user_id = auth.uid()
            AND pc.role IN ('owner', 'editor')
        )
    );

-- Only owners can delete projects
CREATE POLICY "Only owners can delete projects"
    ON projects FOR DELETE
    USING (user_id = auth.uid());
