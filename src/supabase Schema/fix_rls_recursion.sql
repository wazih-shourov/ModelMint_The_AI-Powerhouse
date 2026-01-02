-- ============================================
-- FIX: Infinite Recursion in RLS Policies
-- ============================================
-- Run this AFTER running collaboration_schema.sql

-- Drop problematic policies
DROP POLICY IF EXISTS "Users can view collaborators of their projects" ON project_collaborators;
DROP POLICY IF EXISTS "Collaborators can view canvas state" ON canvas_state;
DROP POLICY IF EXISTS "Collaborators can update canvas state" ON canvas_state;
DROP POLICY IF EXISTS "Collaborators can modify canvas state" ON canvas_state;

-- Recreate with fixed logic (no recursion)
CREATE POLICY "Users can view collaborators of their projects"
    ON project_collaborators FOR SELECT
    USING (
        -- User is the owner of the project
        EXISTS (SELECT 1 FROM projects p WHERE p.id = project_collaborators.project_id AND p.user_id = auth.uid())
        OR
        -- User is listed as a collaborator on this project
        user_id = auth.uid()
    );

CREATE POLICY "Collaborators can view canvas state"
    ON canvas_state FOR SELECT
    USING (
        -- User is the owner
        EXISTS (SELECT 1 FROM projects p WHERE p.id = canvas_state.project_id AND p.user_id = auth.uid())
        OR
        -- User is a collaborator
        EXISTS (SELECT 1 FROM project_collaborators pc WHERE pc.project_id = canvas_state.project_id AND pc.user_id = auth.uid())
    );

CREATE POLICY "Collaborators can update canvas state"
    ON canvas_state FOR INSERT
    WITH CHECK (
        -- User is the owner
        EXISTS (SELECT 1 FROM projects p WHERE p.id = canvas_state.project_id AND p.user_id = auth.uid())
        OR
        -- User is a collaborator
        EXISTS (SELECT 1 FROM project_collaborators pc WHERE pc.project_id = canvas_state.project_id AND pc.user_id = auth.uid())
    );

CREATE POLICY "Collaborators can modify canvas state"
    ON canvas_state FOR UPDATE
    USING (
        -- User is the owner
        EXISTS (SELECT 1 FROM projects p WHERE p.id = canvas_state.project_id AND p.user_id = auth.uid())
        OR
        -- User is a collaborator
        EXISTS (SELECT 1 FROM project_collaborators pc WHERE pc.project_id = canvas_state.project_id AND pc.user_id = auth.uid())
    );
