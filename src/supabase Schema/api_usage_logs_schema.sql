-- API Usage Logs Table for Analytics
-- This table stores every API call for analytics and charting

CREATE TABLE IF NOT EXISTS api_usage_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Request details
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL DEFAULT 'POST',
    
    -- Response details
    status_code INTEGER NOT NULL,
    response_time_ms INTEGER, -- Response time in milliseconds
    
    -- Success/Error tracking
    success BOOLEAN NOT NULL DEFAULT true,
    error_message TEXT,
    
    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes for fast queries
    CONSTRAINT api_usage_logs_created_at_idx CHECK (created_at IS NOT NULL)
);

-- Create indexes for fast analytics queries
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_api_key_id ON api_usage_logs(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_user_id ON api_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_created_at ON api_usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_key_time ON api_usage_logs(api_key_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE api_usage_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only view their own usage logs
CREATE POLICY "Users can view own usage logs"
    ON api_usage_logs
    FOR SELECT
    USING (auth.uid() = user_id);

-- Service role can insert logs (for Python server)
CREATE POLICY "Service role can insert logs"
    ON api_usage_logs
    FOR INSERT
    WITH CHECK (true);

-- Service role can view all logs
CREATE POLICY "Service role can view all logs"
    ON api_usage_logs
    FOR SELECT
    USING (true);

-- Add comment
COMMENT ON TABLE api_usage_logs IS 'Stores API usage logs for analytics and monitoring';
