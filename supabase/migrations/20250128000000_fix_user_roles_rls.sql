-- Fix RLS policy for user_roles table to allow users to read their own roles

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read their own roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;

-- Create policy allowing users to read their own role
CREATE POLICY "Users can read their own roles" ON user_roles
    FOR SELECT 
    USING (auth.uid() = user_id);

-- Ensure RLS is enabled
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT SELECT ON user_roles TO authenticated;
GRANT SELECT ON user_roles TO anon; 