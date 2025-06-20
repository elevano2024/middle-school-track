
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchTasksFromDatabase, updateTaskStatusInDatabase } from '@/utils/taskApi';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { Task, TaskStatus } from '@/types/task';

export const useTasks = () => {
  const { user } = useAuth();
  const { isAdmin, isTeacher, isStudent } = useUserRole();
  const queryClient = useQueryClient();

  // Remove the real-time subscription call - it's handled at app level now

  const query = useQuery({
    queryKey: ['tasks', user?.id, isAdmin, isTeacher, isStudent],
    queryFn: async (): Promise<Task[]> => {
      if (!user?.id) {
        console.log('useTasks: No user ID available');
        return [];
      }
      
      console.log('=== FETCHING TASKS ===');
      console.log('User ID:', user.id);
      console.log('User roles:', { isAdmin, isTeacher, isStudent });
      
      return await fetchTasksFromDatabase(user.id, isStudent, isAdmin, isTeacher);
    },
    enabled: !!user?.id,
  });

  const updateTaskStatus = async (taskId: string, newStatus: TaskStatus): Promise<boolean> => {
    console.log(`useTasks: Updating task ${taskId} to status ${newStatus}`);
    const success = await updateTaskStatusInDatabase(taskId, newStatus);
    
    if (success) {
      // Invalidate and refetch tasks after successful update
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
    
    return success;
  };

  console.log('=== TASKS FETCHED SUCCESSFULLY ===');
  console.log('Tasks count:', query.data?.length || 0);

  return {
    tasks: query.data || [],
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    updateTaskStatus,
  };
};

// Export the Task type for other components to use
export type { Task, TaskStatus } from '@/types/task';
