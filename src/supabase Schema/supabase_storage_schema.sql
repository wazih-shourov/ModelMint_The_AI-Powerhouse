-- Create storage bucket for model files
INSERT INTO storage.buckets (id, name, public)
VALUES ('model-files', 'model-files', true);

-- Set up storage policies
CREATE POLICY "Users can upload their own model files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'model-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own model files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'model-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own model files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'model-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own model files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'model-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Add model_files column to projects table
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS model_files JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN projects.model_files IS 'Stores paths to model.json, metadata.json, and weights files in Supabase Storage';
