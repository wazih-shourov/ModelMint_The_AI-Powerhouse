-- 1. Allow public read access to projects
-- We only modify the 'projects' table here, which you own.

-- Drop the restrictive view policy
DROP POLICY IF EXISTS "Users can view their own projects." ON projects;

-- Create a new policy that allows ANYONE (public) to view projects
CREATE POLICY "Anyone can view projects" ON projects
  FOR SELECT USING (true);

-- Ensure other actions are still restricted to the owner
DROP POLICY IF EXISTS "Users can create their own projects." ON projects;
CREATE POLICY "Users can create their own projects." ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own projects." ON projects;
CREATE POLICY "Users can update their own projects." ON projects
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own projects." ON projects;
CREATE POLICY "Users can delete their own projects." ON projects
  FOR DELETE USING (auth.uid() = user_id);
