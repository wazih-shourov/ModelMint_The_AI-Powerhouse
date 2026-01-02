-- ============================================
-- FIX: Storage Bucket and Policies for Model Files
-- ============================================

-- 1. Create the 'model-files' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('model-files', 'model-files', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can upload their own model files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own model files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view all model files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own model files" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder 1u74u_0" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder 1u74u_1" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder 1u74u_2" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder 1u74u_3" ON storage.objects;

-- 4. Create Policies

-- Policy: Allow authenticated users to upload to their own folder (userId/projectId/...)
CREATE POLICY "Users can upload their own model files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'model-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow authenticated users to update their own model files
CREATE POLICY "Users can update their own model files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'model-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow authenticated users to read all model files (needed for collaboration)
CREATE POLICY "Users can view all model files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'model-files');

-- Policy: Allow users to delete their own files
CREATE POLICY "Users can delete their own model files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'model-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
