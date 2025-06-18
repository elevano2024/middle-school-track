
import { TaskStatus, Task } from '@/types/task';
import { updateTaskStatusInDatabase } from '@/utils/taskApi';

export class TaskStatusManager {
  private updatingTasks: Set<string> = new Set();
  private updatingTasksRef: React.MutableRefObject<Set<string>>;

  constructor(
    private setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
    private fetchTasks: () => Promise<void>
  ) {
    // Create a ref that will be stable across renders
    this.updatingTasksRef = { current: this.updatingTasks };
  }

  async updateTaskStatus(taskId: string, newStatus: TaskStatus): Promise<boolean> {
    // Prevent duplicate updates
    if (this.updatingTasks.has(taskId)) {
      console.log(`Task ${taskId} is already being updated, skipping`);
      return false;
    }

    try {
      this.updatingTasks.add(taskId);
      console.log(`TaskStatusManager: Starting update for task ${taskId} to status ${newStatus}`);
      
      // Store the original task state for potential rollback
      let originalTask: Task | null = null;
      this.setTasks(prevTasks => {
        const taskIndex = prevTasks.findIndex(task => task.id === taskId);
        if (taskIndex !== -1) {
          originalTask = prevTasks[taskIndex];
        }
        return prevTasks;
      });

      // Optimistically update local state first for immediate UI feedback
      this.setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId 
            ? { ...task, status: newStatus, time_in_status: 0, updated_at: new Date().toISOString() }
            : task
        )
      );

      // Update in database
      console.log(`TaskStatusManager: Updating database for task ${taskId}`);
      const success = await updateTaskStatusInDatabase(taskId, newStatus);
      
      if (success) {
        console.log(`TaskStatusManager: Successfully updated task ${taskId} to status ${newStatus}`);
        return true;
      } else {
        console.error(`TaskStatusManager: Database update failed for task ${taskId}`);
        
        // Revert the optimistic update to the original state
        if (originalTask) {
          console.log(`TaskStatusManager: Reverting task ${taskId} to original status ${originalTask.status}`);
          this.setTasks(prevTasks => 
            prevTasks.map(task => 
              task.id === taskId ? originalTask! : task
            )
          );
        } else {
          // If we don't have the original task, refetch from database
          console.log('TaskStatusManager: Refetching tasks due to missing original state');
          await this.fetchTasks();
        }
        
        throw new Error('Database update failed');
      }
    } catch (error) {
      console.error('TaskStatusManager: Error updating task status:', error);
      return false;
    } finally {
      // Remove from updating set after a brief delay to prevent race conditions
      setTimeout(() => {
        this.updatingTasks.delete(taskId);
        console.log(`TaskStatusManager: Removed task ${taskId} from updating set`);
      }, 1000);
    }
  }

  getUpdatingTasksRef(): React.MutableRefObject<Set<string>> {
    return this.updatingTasksRef;
  }
}
