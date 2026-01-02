-- Fix RLS Policy for API Keys Table
-- This allows the Python server (using service role) to insert API keys

-- Drop existing insert policy
DROP POLICY IF EXISTS "Users can create their own API keys." ON api_keys;

-- Create new insert policy that works with both authenticated users and service role
CREATE POLICY "Allow API key creation" ON api_keys
  FOR INSERT 
  WITH CHECK (
    -- Allow if authenticated user matches user_id
    auth.uid() = user_id 
    OR
    -- Allow if using service role (for Python server)
    auth.jwt() ->> 'role' = 'service_role'
  );

-- Also update the select policy to allow service role
DROP POLICY IF EXISTS "Users can view their own API keys." ON api_keys;

CREATE POLICY "Allow viewing API keys" ON api_keys
  FOR SELECT 
  USING (
    auth.uid() = user_id 
    OR 
    auth.jwt() ->> 'role' = 'service_role'
  );

-- Update policy to allow service role to update
DROP POLICY IF EXISTS "Users can update their own API keys." ON api_keys;

CREATE POLICY "Allow updating API keys" ON api_keys
  FOR UPDATE 
  USING (
    auth.uid() = user_id 
    OR 
    auth.jwt() ->> 'role' = 'service_role'
  );

-- Update delete policy
DROP POLICY IF EXISTS "Users can delete their own API keys." ON api_keys;

CREATE POLICY "Allow deleting API keys" ON api_keys
  FOR DELETE 
  USING (
    auth.uid() = user_id 
    OR 
    auth.jwt() ->> 'role' = 'service_role'
  );
