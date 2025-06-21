export type TaskStatus = 'working' | 'need-help' | 'ready-review' | 'completed';

export interface Student {
  id: string;
  name: string;
  grade: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  studentId: string;
  subject: string;
  status: TaskStatus;
  timeInStatus: number; // minutes in current status
  dueDate?: string;
  createdAt?: string;
  // Teacher feedback fields
  teacher_feedback_type?: 'thumbs_up' | 'thumbs_down' | 'neutral' | null;
  teacher_feedback_message?: string | null;
  teacher_next_steps?: string | null;
  feedback_given_at?: string | null;
  feedback_given_by?: string | null;
}

export interface TaskStatusCounts {
  working: number;
  needHelp: number;
  readyReview: number;
  completed: number;
}

export type TeacherFeedbackType = 'thumbs_up' | 'thumbs_down' | 'neutral';
