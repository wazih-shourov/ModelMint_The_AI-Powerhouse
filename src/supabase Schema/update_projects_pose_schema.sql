-- Add project_type column to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_type TEXT DEFAULT 'IMAGE' CHECK (project_type IN ('IMAGE', 'POSE'));

-- Update existing projects to have 'IMAGE' type
UPDATE projects SET project_type = 'IMAGE' WHERE project_type IS NULL;
