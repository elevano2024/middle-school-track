
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
}

export interface TaskStatusCounts {
  working: number;
  needHelp: number;
  readyReview: number;
  completed: number;
}
