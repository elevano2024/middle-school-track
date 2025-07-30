-- Fix RLS policies for real-time subscriptions
-- This migration ensures all tables have proper policies for real-time functionality

-- Enable RLS on all tables if not already enabled
ALTER TABLE IF EXISTS tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS students ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_roles ENABLE ROW LEVEL SECURITY;

-- Enable real-time for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE students;
ALTER PUBLICATION supabase_realtime ADD TABLE subjects;
ALTER PUBLICATION supabase_realtime ADD TABLE attendance;
ALTER PUBLICATION supabase_realtime ADD TABLE user_roles;

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can view tasks based on role" ON tasks;
DROP POLICY IF EXISTS "Users can insert tasks based on role" ON tasks;
DROP POLICY IF EXISTS "Users can update tasks based on role" ON tasks;
DROP POLICY IF EXISTS "Users can delete tasks based on role" ON tasks;

-- TASKS TABLE POLICIES
-- Students can view their own tasks
CREATE POLICY "Students can view their own tasks" ON tasks
    FOR SELECT 
    USING (
        auth.uid() = student_id OR
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'teacher')
        )
    );

-- Teachers and admins can view all tasks
CREATE POLICY "Teachers and admins can view all tasks" ON tasks
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'teacher')
        )
    );

-- Teachers and admins can insert tasks
CREATE POLICY "Teachers and admins can insert tasks" ON tasks
    FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'teacher')
        )
    );

-- Students can update their own task status, teachers/admins can update any task
CREATE POLICY "Users can update tasks based on role" ON tasks
    FOR UPDATE 
    USING (
        auth.uid() = student_id OR
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'teacher')
        )
    )
    WITH CHECK (
        auth.uid() = student_id OR
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'teacher')
        )
    );

-- Only teachers and admins can delete tasks
CREATE POLICY "Teachers and admins can delete tasks" ON tasks
    FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'teacher')
        )
    );

-- SUBJECTS TABLE POLICIES  
DROP POLICY IF EXISTS "Anyone can view subjects" ON subjects;
DROP POLICY IF EXISTS "Teachers and admins can manage subjects" ON subjects;

-- All authenticated users can view subjects
CREATE POLICY "Authenticated users can view subjects" ON subjects
    FOR SELECT 
    USING (auth.role() = 'authenticated');

-- Teachers and admins can manage subjects
CREATE POLICY "Teachers and admins can manage subjects" ON subjects
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'teacher')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'teacher')
        )
    );

-- STUDENTS TABLE POLICIES
DROP POLICY IF EXISTS "Users can view students based on role" ON students;
DROP POLICY IF EXISTS "Teachers and admins can manage students" ON students;

-- Students can view their own record, teachers/admins can view all
CREATE POLICY "Users can view students based on role" ON students
    FOR SELECT 
    USING (
        auth.uid() = id OR
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'teacher')
        )
    );

-- Teachers and admins can manage students
CREATE POLICY "Teachers and admins can manage students" ON students
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'teacher')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'teacher')
        )
    );

-- USER_ROLES TABLE POLICIES
DROP POLICY IF EXISTS "Users can view roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON user_roles;

-- Users can view their own roles, admins can view all
CREATE POLICY "Users can view roles based on access" ON user_roles
    FOR SELECT 
    USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Only admins can manage roles
CREATE POLICY "Admins can manage user roles" ON user_roles
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- ATTENDANCE TABLE POLICIES
DROP POLICY IF EXISTS "Students can view/update their attendance" ON attendance;
DROP POLICY IF EXISTS "Teachers and admins can view all attendance" ON attendance;
DROP POLICY IF EXISTS "Students can insert their own attendance" ON attendance;
DROP POLICY IF EXISTS "Teachers and admins can manage all attendance" ON attendance;
DROP POLICY IF EXISTS "Only teachers and admins can delete attendance" ON attendance;

-- Students can view their own attendance
CREATE POLICY "Students can view their own attendance" ON attendance
    FOR SELECT 
    USING (
        auth.uid() = student_id OR
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'teacher')
        )
    );

-- Students can insert their own attendance
CREATE POLICY "Students can insert their own attendance" ON attendance
    FOR INSERT 
    WITH CHECK (auth.uid() = student_id);

-- Students can update their own attendance
CREATE POLICY "Students can update their own attendance" ON attendance
    FOR UPDATE 
    USING (auth.uid() = student_id)
    WITH CHECK (auth.uid() = student_id);

-- Teachers and admins can manage all attendance
CREATE POLICY "Teachers and admins can manage all attendance" ON attendance
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'teacher')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'teacher')
        )
    );

-- Only teachers and admins can delete attendance
CREATE POLICY "Only teachers and admins can delete attendance" ON attendance
    FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'teacher')
        )
    );

-- Ensure real-time is properly configured
-- Force refresh of real-time subscriptions
NOTIFY pgrst, 'reload schema'; 