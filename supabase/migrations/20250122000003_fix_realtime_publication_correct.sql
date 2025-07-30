-- Fix real-time publication correctly
-- The previous migration had a conflict with FOR ALL TABLES

-- First, ensure the replica identity is set for real-time
ALTER TABLE tasks REPLICA IDENTITY FULL;
ALTER TABLE students REPLICA IDENTITY FULL;
ALTER TABLE subjects REPLICA IDENTITY FULL;
ALTER TABLE attendance REPLICA IDENTITY FULL;
ALTER TABLE user_roles REPLICA IDENTITY FULL;

-- Drop the existing publication
DROP PUBLICATION IF EXISTS supabase_realtime;

-- Create publication with specific tables (not FOR ALL TABLES)
CREATE PUBLICATION supabase_realtime FOR TABLE 
    tasks,
    students, 
    subjects,
    attendance,
    user_roles;

-- Create simple, permissive policies for real-time
-- Real-time subscriptions need to see changes for caching

-- Tasks real-time policy
DROP POLICY IF EXISTS "Tasks realtime access" ON tasks;
CREATE POLICY "Tasks realtime access" ON tasks
    FOR SELECT 
    TO authenticated
    USING (true);

-- Students real-time policy  
DROP POLICY IF EXISTS "Students realtime access" ON students;
CREATE POLICY "Students realtime access" ON students
    FOR SELECT 
    TO authenticated
    USING (true);

-- Subjects real-time policy
DROP POLICY IF EXISTS "Subjects realtime access" ON subjects;
CREATE POLICY "Subjects realtime access" ON subjects
    FOR SELECT 
    TO authenticated
    USING (true);

-- Attendance real-time policy
DROP POLICY IF EXISTS "Attendance realtime access" ON attendance;
CREATE POLICY "Attendance realtime access" ON attendance
    FOR SELECT 
    TO authenticated
    USING (true);

-- User roles real-time policy
DROP POLICY IF EXISTS "User roles realtime access" ON user_roles;
CREATE POLICY "User roles realtime access" ON user_roles
    FOR SELECT 
    TO authenticated
    USING (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, authenticated, service_role;

-- Grant permissions on the realtime schema
GRANT USAGE ON SCHEMA realtime TO postgres, authenticated, service_role;

-- Force reload
SELECT pg_reload_conf();
NOTIFY pgrst, 'reload schema'; 