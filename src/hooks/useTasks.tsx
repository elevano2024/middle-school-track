import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { fetchTasksFromDatabase, updateTaskStatusInDatabase } from '@/utils/taskApi';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { usePresentationMode } from '@/contexts/PresentationContext';
import { Task, TaskStatus } from '@/types/task';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useTasks = () => {
  const { user } = useAuth();
  const { isAdmin, isTeacher, isStudent, loading: roleLoading } = useUserRole();
  const { isPresentationMode } = usePresentationMode();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ['tasks', user?.id, isAdmin, isTeacher, isStudent],
    queryFn: async (): Promise<Task[]> => {
      if (!user?.id) {
        console.log('useTasks: No user ID available');
        return [];
      }
      
      // Wait for role loading to complete before fetching tasks
      if (roleLoading) {
        console.log('useTasks: Role still loading, skipping fetch');
        return [];
      }
      
      console.log('=== FETCHING TASKS ===');
      console.log('User ID:', user.id);
      console.log('User roles:', { isAdmin, isTeacher, isStudent });
      console.log('Presentation mode:', isPresentationMode);
      
      return await fetchTasksFromDatabase(user.id, isStudent, isAdmin, isTeacher);
    },
    enabled: !!user?.id && !roleLoading,
    // More aggressive settings for presentation mode
    staleTime: isPresentationMode ? 1000 * 5 : 1000 * 30, // 5 seconds in presentation mode, 30 seconds normally
    refetchInterval: isPresentationMode ? 1000 * 3 : 1000 * 60, // 3 seconds in presentation mode, 1 minute normally
    refetchIntervalInBackground: true, // Keep polling even when not focused
    refetchOnWindowFocus: true, // Refetch when window gains focus
    refetchOnMount: true, // Always refetch on mount for fresh data
    retry: 3, // Retry failed requests
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });

  // Optimistic delete mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);
      
      if (error) throw error;
      return taskId;
    },
    onMutate: async (taskId: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      
      // Snapshot the previous value
      const previousTasks = queryClient.getQueryData<Task[]>(['tasks', user?.id, isAdmin, isTeacher, isStudent]);
      
      // Optimistically update the cache
      queryClient.setQueryData<Task[]>(
        ['tasks', user?.id, isAdmin, isTeacher, isStudent],
        (oldTasks) => oldTasks?.filter(task => task.id !== taskId) || []
      );
      
      return { previousTasks };
    },
    onError: (error, taskId, context) => {
      // Rollback on error
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks', user?.id, isAdmin, isTeacher, isStudent], context.previousTasks);
      }
      console.error('Error deleting task:', error);
      toast({
        title: "Error",
        description: "Failed to delete task. Please try again.",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      toast({
        title: "Success", 
        description: "Task deleted successfully!",
      });
    },
    onSettled: () => {
      // Force immediate refetch for production reliability
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.refetchQueries({ queryKey: ['tasks'] });
    },
  });

  // Optimistic update mutation with enhanced error handling
  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, updates }: { taskId: string, updates: Partial<Task> }) => {
      console.log(`useTasks: Updating task ${taskId} with:`, updates);
      
      const { error, data } = await supabase
        .from('tasks')
        .update({
          ...updates,
          updated_at: new Date().toISOString() // Ensure updated_at is set
        })
        .eq('id', taskId)
        .select();
      
      if (error) {
        console.error('useTasks: Update error:', error);
        throw error;
      }
      
      console.log('useTasks: Update successful:', data);
      return { taskId, updates, data };
    },
    onMutate: async ({ taskId, updates }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      
      const previousTasks = queryClient.getQueryData<Task[]>(['tasks', user?.id, isAdmin, isTeacher, isStudent]);
      
      // Optimistically update the cache with timestamp
      queryClient.setQueryData<Task[]>(
        ['tasks', user?.id, isAdmin, isTeacher, isStudent],
        (oldTasks) => 
          oldTasks?.map(task => 
            task.id === taskId ? { 
              ...task, 
              ...updates,
              updated_at: new Date().toISOString()
            } : task
          ) || []
      );
      
      console.log(`useTasks: Optimistic update applied for task ${taskId}`);
      return { previousTasks };
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks', user?.id, isAdmin, isTeacher, isStudent], context.previousTasks);
      }
      console.error('useTasks: Error updating task:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update task. Changes have been reverted.",
        variant: "destructive",
      });
    },
    onSuccess: (result) => {
      console.log(`useTasks: Task ${result.taskId} updated successfully`);
      toast({
        title: "Success",
        description: "Task updated successfully!",
      });
    },
    onSettled: () => {
      // Force immediate refetch for production reliability
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.refetchQueries({ queryKey: ['tasks'] });
      
      // Also invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });

  // Enhanced updateTask function for better production reliability
  const updateTask = ({ taskId, updates }: { taskId: string, updates: Partial<Task> }) => {
    console.log(`useTasks: Initiating update for task ${taskId}`);
    updateTaskMutation.mutate({ taskId, updates });
  };

  // Legacy function for backward compatibility
  const updateTaskStatus = async (taskId: string, newStatus: TaskStatus): Promise<boolean> => {
    console.log(`useTasks: Legacy updateTaskStatus called for task ${taskId} to status ${newStatus}`);
    
    try {
      updateTask({ taskId, updates: { status: newStatus } });
      return true; // Optimistic response
    } catch (error) {
      console.error('useTasks: Error in updateTaskStatus:', error);
      return false;
    }
  };

  return {
    tasks: query.data || [],
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    isRefetching: query.isRefetching,
    updateTask,
    updateTaskStatus,
    deleteTask: deleteTaskMutation.mutate,
    isUpdating: updateTaskMutation.isPending,
    isDeleting: deleteTaskMutation.isPending,
  };
};

// Export the Task type for other components to use
export type { Task, TaskStatus } from '@/types/task';
