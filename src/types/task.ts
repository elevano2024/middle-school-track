export interface Task {
  id: string;
  title: string;
  description: string | null;
  student_id: string;
  subject_id: string;
  status: TaskStatus;
  time_in_status: number | null;
  created_at: string;
  updated_at: string;
  // Teacher feedback fields
  teacher_feedback_type?: 'thumbs_up' | 'thumbs_down' | 'neutral' | null;
  teacher_feedback_message?: string | null;
  teacher_next_steps?: string | null;
  feedback_given_at?: string | null;
  feedback_given_by?: string | null;
  students?: {
    name: string;
    email?: string;
  } | null;
  subjects?: {
    name: string;
  } | null;
}

export type TaskStatus = 'working' | 'need-help' | 'ready-review' | 'completed';

export type TeacherFeedbackType = 'thumbs_up' | 'thumbs_down' | 'neutral';
