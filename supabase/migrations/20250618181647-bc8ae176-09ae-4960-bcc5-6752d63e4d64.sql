
-- First, ensure RLS is enabled on the tasks table
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Students can view their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Students can update their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Teachers and admins can view all tasks" ON public.tasks;
DROP POLICY IF EXISTS "Teachers and admins can update all tasks" ON public.tasks;
DROP POLICY IF EXISTS "Teachers and admins can insert tasks" ON public.tasks;
DROP POLICY IF EXISTS "Teachers and admins can delete tasks" ON public.tasks;
DROP POLICY IF EXISTS "Admins can manage all tasks" ON public.tasks;
DROP POLICY IF EXISTS "Admins can view all tasks" ON public.tasks;
DROP POLICY IF EXISTS "Teachers and admins can manage tasks" ON public.tasks;
DROP POLICY IF EXISTS "Teachers can manage all tasks" ON public.tasks;
DROP POLICY IF EXISTS "Teachers can view all tasks" ON public.tasks;

-- Create a security definer function to check user roles
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role::text FROM public.user_roles WHERE user_id = user_uuid LIMIT 1;
$$;

-- Create policies that allow proper access
-- Students can view their own tasks
CREATE POLICY "Students can view their own tasks" 
ON public.tasks 
FOR SELECT 
USING (
  student_id = auth.uid() OR 
  public.get_user_role(auth.uid()) IN ('admin', 'teacher')
);

-- Students can update their own tasks, teachers and admins can update all tasks
CREATE POLICY "Students can update their own tasks" 
ON public.tasks 
FOR UPDATE 
USING (
  student_id = auth.uid() OR 
  public.get_user_role(auth.uid()) IN ('admin', 'teacher')
);

-- Only teachers and admins can insert tasks
CREATE POLICY "Teachers and admins can insert tasks" 
ON public.tasks 
FOR INSERT 
WITH CHECK (
  public.get_user_role(auth.uid()) IN ('admin', 'teacher')
);

-- Only teachers and admins can delete tasks
CREATE POLICY "Teachers and admins can delete tasks" 
ON public.tasks 
FOR DELETE 
USING (
  public.get_user_role(auth.uid()) IN ('admin', 'teacher')
);
