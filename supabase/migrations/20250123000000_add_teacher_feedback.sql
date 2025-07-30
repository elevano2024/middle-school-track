-- Add teacher feedback system to tasks table
-- This enables teachers to provide feedback on completed tasks

-- Add feedback columns to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS teacher_feedback_type VARCHAR(20) CHECK (teacher_feedback_type IN ('thumbs_up', 'thumbs_down', 'neutral'));
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS teacher_feedback_message TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS teacher_next_steps TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS feedback_given_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS feedback_given_by UUID REFERENCES auth.users(id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_tasks_feedback_given_by ON tasks(feedback_given_by);
CREATE INDEX IF NOT EXISTS idx_tasks_feedback_given_at ON tasks(feedback_given_at);

-- Update RLS policies to allow teachers to update feedback fields
-- Teachers and admins can update feedback on any task
DROP POLICY IF EXISTS "Teachers can update task feedback" ON tasks;
CREATE POLICY "Teachers can update task feedback" ON tasks
    FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = auth.uid() 
            AND ur.role IN ('admin', 'teacher')
            LIMIT 1
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = auth.uid() 
            AND ur.role IN ('admin', 'teacher')
            LIMIT 1
        )
    );

-- Add helpful comment
COMMENT ON COLUMN tasks.teacher_feedback_type IS 'Type of feedback: thumbs_up, thumbs_down, or neutral';
COMMENT ON COLUMN tasks.teacher_feedback_message IS 'Encouraging or instructional message from teacher';
COMMENT ON COLUMN tasks.teacher_next_steps IS 'Suggested next steps or additional work';
COMMENT ON COLUMN tasks.feedback_given_at IS 'When the feedback was provided';
COMMENT ON COLUMN tasks.feedback_given_by IS 'Which teacher provided the feedback'; 