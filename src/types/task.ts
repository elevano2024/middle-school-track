
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
  students?: {
    name: string;
    email?: string;
  } | null;
  subjects?: {
    name: string;
  } | null;
}

export type TaskStatus = 'working' | 'need-help' | 'ready-review' | 'completed';
