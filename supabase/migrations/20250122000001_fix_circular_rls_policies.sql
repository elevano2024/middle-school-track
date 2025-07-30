-- Fix circular dependency in RLS policies
-- The user_roles policies were causing infinite recursion

-- Drop the problematic user_roles policies
DROP POLICY IF EXISTS "Users can view roles based on access" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage user roles" ON user_roles;

-- Create simpler, non-recursive policies for user_roles
-- Users can view their own roles (no recursion)
CREATE POLICY "Users can view their own roles" ON user_roles
    FOR SELECT 
    USING (auth.uid() = user_id);

-- Service role can manage all roles (for admin operations)
CREATE POLICY "Service role can manage all roles" ON user_roles
    FOR ALL 
    USING (auth.role() = 'service_role');

-- Allow authenticated users to read their own roles (essential for role checking)
CREATE POLICY "Authenticated users can read own roles" ON user_roles
    FOR SELECT 
    USING (auth.uid() = user_id);

-- Fix tasks policies to be more specific and avoid conflicts
DROP POLICY IF EXISTS "Students can view their own tasks" ON tasks;
DROP POLICY IF EXISTS "Teachers and admins can view all tasks" ON tasks;

-- Create a single, comprehensive tasks SELECT policy
CREATE POLICY "Tasks access by role" ON tasks
    FOR SELECT 
    USING (
        -- Students can see their own tasks
        auth.uid() = student_id OR
        -- OR user has admin/teacher role (simplified check)
        EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = auth.uid() 
            AND ur.role IN ('admin', 'teacher')
            LIMIT 1
        )
    );

-- Simplify other policies to avoid recursion issues
DROP POLICY IF EXISTS "Users can update tasks based on role" ON tasks;

CREATE POLICY "Tasks update by role" ON tasks
    FOR UPDATE 
    USING (
        auth.uid() = student_id OR
        EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = auth.uid() 
            AND ur.role IN ('admin', 'teacher')
            LIMIT 1
        )
    );

-- Fix students policies
DROP POLICY IF EXISTS "Users can view students based on role" ON students;

CREATE POLICY "Students access by role" ON students
    FOR SELECT 
    USING (
        auth.uid() = id OR
        EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = auth.uid() 
            AND ur.role IN ('admin', 'teacher')
            LIMIT 1
        )
    );

-- Fix attendance policies  
DROP POLICY IF EXISTS "Students can view their own attendance" ON attendance;
DROP POLICY IF EXISTS "Teachers and admins can manage all attendance" ON attendance;

CREATE POLICY "Attendance access by role" ON attendance
    FOR SELECT 
    USING (
        auth.uid() = student_id OR
        EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = auth.uid() 
            AND ur.role IN ('admin', 'teacher')
            LIMIT 1
        )
    );

CREATE POLICY "Attendance management by role" ON attendance
    FOR ALL 
    USING (
        -- Students can manage their own attendance
        auth.uid() = student_id OR
        -- Teachers/admins can manage all attendance
        EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = auth.uid() 
            AND ur.role IN ('admin', 'teacher')
            LIMIT 1
        )
    );

-- Add a function to safely check roles (prevents recursion)
CREATE OR REPLACE FUNCTION public.user_has_role(user_uuid uuid, role_name text)
RETURNS boolean
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM user_roles 
        WHERE user_id = user_uuid 
        AND role = role_name::app_role
    );
END;
$$
LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.user_has_role(uuid, text) TO authenticated;

-- Force refresh
NOTIFY pgrst, 'reload schema'; 