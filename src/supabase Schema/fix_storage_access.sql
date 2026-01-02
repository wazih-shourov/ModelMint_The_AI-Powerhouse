-- ============================================
-- FIX: Supabase Storage Access for Collaborators
-- ============================================

-- This allows collaborators to access model files stored in the 'models' bucket

-- First, check if the bucket exists and is public or private
-- Run this in Supabase SQL Editor:

-- Option 1: Make the entire 'models' bucket public (easier but less secure)
UPDATE storage.buckets 
SET public = true 
WHERE id = 'models';

-- Option 2: Add RLS policies for collaborator access (more secure)
-- This allows collaborators to read model files from projects they have access to

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can upload their own models" ON storage.objects;
DROP POLICY IF EXISTS "Users can read their own models" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own models" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own models" ON storage.objects;

-- Allow users to upload models for their own projects
CREATE POLICY "Users can upload models for their projects"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'models' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to read models from projects they own OR collaborate on
CREATE POLICY "Users can read models from accessible projects"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'models' AND
    (
        -- User owns the model
        (storage.foldername(name))[1] = auth.uid()::text
        OR
        -- User is a collaborator on a project that uses this model
        EXISTS (
            SELECT 1 FROM projects p
            INNER JOIN project_collaborators pc ON p.id = pc.project_id
            WHERE pc.user_id = auth.uid()
            AND p.user_id::text = (storage.foldername(name))[1]
        )
    )
);

-- Allow users to update their own models
CREATE POLICY "Users can update their own models"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'models' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own models
CREATE POLICY "Users can delete their own models"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'models' AND
    (storage.foldername(name))[1] = auth.uid()::text
);
