
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchTasksFromDatabase } from '@/utils/taskApi';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useTasksRealtime } from '@/hooks/useTasksRealtime';
import { Task } from '@/types/task';

export const useTasks = () => {
  const { user } = useAuth();
  const { isAdmin, isTeacher, isStudent } = useUserRole();
  const queryClient = useQueryClient();

  // Set up real-time subscription
  useTasksRealtime();

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

  console.log('=== TASKS FETCHED SUCCESSFULLY ===');
  console.log('Tasks count:', query.data?.length || 0);

  return {
    tasks: query.data || [],
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};
