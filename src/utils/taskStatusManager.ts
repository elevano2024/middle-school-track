
import { TaskStatus, Task } from '@/types/task';
import { updateTaskStatusInDatabase } from '@/utils/taskApi';

export class TaskStatusManager {
  private updatingTasks: Set<string> = new Set();

  constructor(
    private setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
    private fetchTasks: () => Promise<void>
  ) {}

  async updateTaskStatus(taskId: string, newStatus: TaskStatus): Promise<boolean> {
    // Prevent duplicate updates
    if (this.updatingTasks.has(taskId)) {
      console.log(`Task ${taskId} is already being updated, skipping`);
      return false;
    }

    try {
      this.updatingTasks.add(taskId);
      
      // Optimistically update local state first for immediate UI feedback
      this.setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId 
            ? { ...task, status: newStatus, time_in_status: 0, updated_at: new Date().toISOString() }
            : task
        )
      );

      await updateTaskStatusInDatabase(taskId, newStatus);
      return true;
    } catch (error) {
      console.error('Error updating task status:', error);
      // Revert optimistic update on error
      this.fetchTasks();
      return false;
    } finally {
      // Remove from updating set after a brief delay to prevent race conditions
      setTimeout(() => {
        this.updatingTasks.delete(taskId);
      }, 1000);
    }
  }

  getUpdatingTasksRef(): React.MutableRefObject<Set<string>> {
    return { current: this.updatingTasks };
  }
}
