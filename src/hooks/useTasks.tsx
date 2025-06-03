
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useTasksRealtime } from '@/hooks/useTasksRealtime';
import { fetchTasksFromDatabase } from '@/utils/taskApi';
import { TaskStatusManager } from '@/utils/taskStatusManager';
import { Task, TaskStatus } from '@/types/task';

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { isAdmin, isTeacher, isStudent, loading: roleLoading } = useUserRole();

  const fetchTasks = useCallback(async () => {
    if (!user) {
      console.log('No user found, skipping task fetch');
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const tasksData = await fetchTasksFromDatabase(user.id, isStudent, isAdmin, isTeacher);
      setTasks(tasksData);
    } catch (error) {
      console.error('Error in fetchTasks:', error);
      setError('Failed to fetch tasks');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [user, isAdmin, isTeacher, isStudent]);

  // Create task status manager instance
  const taskStatusManager = new TaskStatusManager(setTasks, fetchTasks);

  useEffect(() => {
    console.log('useTasks effect triggered - user:', user?.id, 'roles:', { isAdmin, isTeacher, isStudent }, 'roleLoading:', roleLoading);
    
    // Fetch tasks if we have a user and roles have finished loading
    if (user && !roleLoading) {
      fetchTasks();
    } else if (!user) {
      setLoading(false);
    }
  }, [user, isAdmin, isTeacher, isStudent, roleLoading, fetchTasks]);

  // Set up real-time subscription
  useTasksRealtime({
    userId: user?.id,
    onTasksChanged: fetchTasks,
    updatingTasksRef: taskStatusManager.getUpdatingTasksRef()
  });

  const updateTaskStatus = (taskId: string, newStatus: TaskStatus) => {
    return taskStatusManager.updateTaskStatus(taskId, newStatus);
  };

  return { tasks, loading, error, updateTaskStatus, refetch: fetchTasks };
};

// Re-export the Task interface for backward compatibility
export type { Task } from '@/types/task';
