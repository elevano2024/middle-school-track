
-- Disable Row Level Security on tasks table
ALTER TABLE public.tasks DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies on tasks table
DROP POLICY IF EXISTS "Students can view their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Students can update their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Teachers and admins can view all tasks" ON public.tasks;
DROP POLICY IF EXISTS "Teachers and admins can update all tasks" ON public.tasks;
DROP POLICY IF EXISTS "Teachers and admins can insert tasks" ON public.tasks;
DROP POLICY IF EXISTS "Teachers and admins can delete tasks" ON public.tasks;
