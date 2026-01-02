-- Add base_model_name column to projects table
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS base_model_name TEXT DEFAULT 'MobileNet';

COMMENT ON COLUMN projects.base_model_name IS 'Stores the base model name (MobileNet or InceptionV3)';
