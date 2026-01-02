-- Add columns for Landing Page Builder
ALTER TABLE deployments 
ADD COLUMN IF NOT EXISTS page_config JSONB DEFAULT '{"sections": []}'::jsonb,
ADD COLUMN IF NOT EXISTS custom_html TEXT,
ADD COLUMN IF NOT EXISTS builder_mode TEXT DEFAULT 'visual' CHECK (builder_mode IN ('visual', 'html'));

-- Comment on columns
COMMENT ON COLUMN deployments.page_config IS 'JSON configuration for the visual page builder';
COMMENT ON COLUMN deployments.custom_html IS 'Raw HTML content for advanced users';
COMMENT ON COLUMN deployments.builder_mode IS 'Current mode of the landing page: visual or html';
