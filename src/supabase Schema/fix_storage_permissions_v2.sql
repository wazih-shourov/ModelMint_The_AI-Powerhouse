-- ============================================
-- FIX V2: Storage Permissions (Safe Mode)
-- ============================================

-- 1. Create the 'model-files' bucket if it doesn't exist
-- This part is usually safe for everyone
INSERT INTO storage.buckets (id, name, public)
VALUES ('model-files', 'model-files', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Create Policies
-- We removed the "ALTER TABLE" command which was causing the permission error.
-- RLS is already enabled on storage.objects by default in Supabase.

-- Policy: Upload
DROP POLICY IF EXISTS "Users can upload their own model files" ON storage.objects;
CREATE POLICY "Users can upload their own model files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'model-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Update
DROP POLICY IF EXISTS "Users can update their own model files" ON storage.objects;
CREATE POLICY "Users can update their own model files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'model-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: View (Read)
DROP POLICY IF EXISTS "Users can view all model files" ON storage.objects;
CREATE POLICY "Users can view all model files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'model-files');

-- Policy: Delete
DROP POLICY IF EXISTS "Users can delete their own model files" ON storage.objects;
CREATE POLICY "Users can delete their own model files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'model-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
