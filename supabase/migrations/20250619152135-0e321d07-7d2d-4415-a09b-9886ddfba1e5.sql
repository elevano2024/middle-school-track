
-- Create attendance table to track student presence
CREATE TABLE public.attendance (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  is_present boolean NOT NULL DEFAULT false,
  marked_at timestamp with time zone DEFAULT now(),
  marked_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(student_id, date)
);

-- Enable RLS on attendance table
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Create policies for attendance table
-- Teachers and admins can view all attendance records
CREATE POLICY "Teachers and admins can view attendance" 
  ON public.attendance 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'teacher')
    )
  );

-- Teachers and admins can insert attendance records
CREATE POLICY "Teachers and admins can mark attendance" 
  ON public.attendance 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'teacher')
    )
  );

-- Teachers and admins can update attendance records
CREATE POLICY "Teachers and admins can update attendance" 
  ON public.attendance 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'teacher')
    )
  );

-- Students can view their own attendance
CREATE POLICY "Students can view their own attendance" 
  ON public.attendance 
  FOR SELECT 
  USING (
    student_id IN (
      SELECT id FROM public.students WHERE id = auth.uid()
    )
  );

-- Create an index for better performance on date queries
CREATE INDEX idx_attendance_student_date ON public.attendance(student_id, date);
