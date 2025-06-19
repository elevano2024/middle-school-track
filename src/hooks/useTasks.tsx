
import { useState, useEffect, useCallback, useRef } from 'react';
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
      console.log('useTasks: No user found, skipping task fetch');
      setLoading(false);
      return;
    }

    console.log('=== FETCHING TASKS ===');
    console.log('User ID:', user.id);
    console.log('Roles:', { isAdmin, isTeacher, isStudent });

    try {
      setError(null);
      const tasksData = await fetchTasksFromDatabase(user.id, isStudent, isAdmin, isTeacher);
      console.log('=== TASKS FETCHED SUCCESSFULLY ===');
      console.log('Tasks count:', tasksData.length);
      
      setTasks(tasksData);
    } catch (error) {
      console.error('Error in fetchTasks:', error);
      setError('Failed to fetch tasks');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [user, isAdmin, isTeacher, isStudent]);

  // Create task status manager instance and persist it across renders
  const taskStatusManagerRef = useRef<TaskStatusManager | null>(null);
  
  if (!taskStatusManagerRef.current) {
    taskStatusManagerRef.current = new TaskStatusManager(setTasks, fetchTasks);
  }

  // Initial fetch when user and roles are available
  useEffect(() => {
    console.log('useTasks initial effect - user:', user?.id, 'roles:', { isAdmin, isTeacher, isStudent }, 'roleLoading:', roleLoading);
    
    if (user && !roleLoading) {
      fetchTasks();
    } else if (!user) {
      setLoading(false);
    }
  }, [user, isAdmin, isTeacher, isStudent, roleLoading, fetchTasks]);

  // Set up real-time subscription with a stable callback
  const realTimeCallback = useCallback(() => {
    console.log('=== REAL-TIME CALLBACK TRIGGERED ===');
    fetchTasks();
  }, [fetchTasks]);

  useTasksRealtime({
    userId: user?.id,
    onTasksChanged: realTimeCallback,
    updatingTasksRef: taskStatusManagerRef.current?.getUpdatingTasksRef() || { current: new Set() }
  });

  const updateTaskStatus = (taskId: string, newStatus: TaskStatus) => {
    if (!taskStatusManagerRef.current) {
      console.error('TaskStatusManager not initialized');
      return Promise.resolve(false);
    }
    return taskStatusManagerRef.current.updateTaskStatus(taskId, newStatus);
  };

  return { tasks, loading, error, updateTaskStatus, refetch: fetchTasks };
};

// Re-export the Task interface for backward compatibility
export type { Task } from '@/types/task';
