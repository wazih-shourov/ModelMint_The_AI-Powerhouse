-- Add base_model column to projects table
-- This column stores which base model is used (MobileNet, InceptionV3, MoveNet, USE)

ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS base_model TEXT DEFAULT 'MobileNet';

-- Update existing projects to have MobileNet as default
UPDATE projects 
SET base_model = 'MobileNet' 
WHERE base_model IS NULL;

-- Optional: If you have base_model_name column, migrate data
UPDATE projects 
SET base_model = base_model_name 
WHERE base_model_name IS NOT NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_projects_base_model ON projects(base_model);
