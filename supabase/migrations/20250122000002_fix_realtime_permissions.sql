-- Fix real-time permissions and publications
-- The CHANNEL_ERROR indicates real-time publication issues

-- First, ensure the replica identity is set for real-time
ALTER TABLE tasks REPLICA IDENTITY FULL;
ALTER TABLE students REPLICA IDENTITY FULL;
ALTER TABLE subjects REPLICA IDENTITY FULL;
ALTER TABLE attendance REPLICA IDENTITY FULL;
ALTER TABLE user_roles REPLICA IDENTITY FULL;

-- Drop and recreate the real-time publication with proper settings
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR ALL TABLES;

-- Ensure all tables are in the publication
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE students;
ALTER PUBLICATION supabase_realtime ADD TABLE subjects;
ALTER PUBLICATION supabase_realtime ADD TABLE attendance;
ALTER PUBLICATION supabase_realtime ADD TABLE user_roles;

-- Create a more permissive policy for real-time on tasks table
-- Real-time needs special handling
DROP POLICY IF EXISTS "Tasks realtime access" ON tasks;
CREATE POLICY "Tasks realtime access" ON tasks
    FOR SELECT 
    TO authenticated
    USING (true); -- Allow authenticated users to see all changes for real-time

-- Create permissive real-time policies for other tables
DROP POLICY IF EXISTS "Students realtime access" ON students;
CREATE POLICY "Students realtime access" ON students
    FOR SELECT 
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Subjects realtime access" ON subjects;
CREATE POLICY "Subjects realtime access" ON subjects
    FOR SELECT 
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Attendance realtime access" ON attendance;
CREATE POLICY "Attendance realtime access" ON attendance
    FOR SELECT 
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "User roles realtime access" ON user_roles;
CREATE POLICY "User roles realtime access" ON user_roles
    FOR SELECT 
    TO authenticated
    USING (true);

-- Grant necessary permissions for real-time
GRANT USAGE ON SCHEMA public TO postgres, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, authenticated, service_role;

-- Ensure the realtime schema has proper permissions
GRANT USAGE ON SCHEMA realtime TO postgres, authenticated, service_role;

-- Force PostgreSQL to reload the configuration
SELECT pg_reload_conf();

-- Notify PostgREST to reload the schema
NOTIFY pgrst, 'reload schema'; 