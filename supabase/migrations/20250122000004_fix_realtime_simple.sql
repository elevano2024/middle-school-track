-- Simple real-time fix without superuser functions
-- Remove the pg_reload_conf call that requires superuser privileges

-- Set replica identity for real-time
ALTER TABLE tasks REPLICA IDENTITY FULL;
ALTER TABLE students REPLICA IDENTITY FULL;
ALTER TABLE subjects REPLICA IDENTITY FULL;
ALTER TABLE attendance REPLICA IDENTITY FULL;
ALTER TABLE user_roles REPLICA IDENTITY FULL;

-- Drop existing publication
DROP PUBLICATION IF EXISTS supabase_realtime;

-- Create publication with our tables
CREATE PUBLICATION supabase_realtime FOR TABLE 
    tasks,
    students, 
    subjects,
    attendance,
    user_roles;

-- Create permissive real-time policies
DROP POLICY IF EXISTS "Tasks realtime access" ON tasks;
CREATE POLICY "Tasks realtime access" ON tasks
    FOR SELECT 
    TO authenticated
    USING (true);

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

-- Basic permission grants (no superuser required)
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;

-- Notify PostgREST only (this should work)
NOTIFY pgrst, 'reload schema'; 