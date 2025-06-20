import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { fetchTasksFromDatabase, updateTaskStatusInDatabase } from '@/utils/taskApi';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { Task, TaskStatus } from '@/types/task';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useTasks = () => {
  const { user } = useAuth();
  const { isAdmin, isTeacher, isStudent, loading: roleLoading } = useUserRole();
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
      
      return await fetchTasksFromDatabase(user.id, isStudent, isAdmin, isTeacher);
    },
    enabled: !!user?.id && !roleLoading,
    staleTime: 1000 * 60 * 5, // 5 minutes - longer cache since we have real-time updates
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Don't refetch on mount since we have real-time updates
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
      // Always refetch after mutation settles
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  // Optimistic update mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, updates }: { taskId: string, updates: Partial<Task> }) => {
      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId);
      
      if (error) throw error;
      return { taskId, updates };
    },
    onMutate: async ({ taskId, updates }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      
      const previousTasks = queryClient.getQueryData<Task[]>(['tasks', user?.id, isAdmin, isTeacher, isStudent]);
      
      // Optimistically update the cache
      queryClient.setQueryData<Task[]>(
        ['tasks', user?.id, isAdmin, isTeacher, isStudent],
        (oldTasks) => 
          oldTasks?.map(task => 
            task.id === taskId ? { ...task, ...updates } : task
          ) || []
      );
      
      return { previousTasks };
    },
    onError: (error, variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks', user?.id, isAdmin, isTeacher, isStudent], context.previousTasks);
      }
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: "Failed to update task. Please try again.",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Task updated successfully!",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
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

  // Only log when data is actually loaded (not during loading states)
  if (query.data && query.data.length > 0) {
    console.log('=== TASKS LOADED ===');
    console.log('Tasks count:', query.data.length);
  }

  return {
    tasks: query.data || [],
    loading: query.isLoading && !roleLoading,
    error: query.error,
    refetch: query.refetch,
    updateTaskStatus,
    // New reactive methods
    deleteTask: deleteTaskMutation.mutate,
    updateTask: updateTaskMutation.mutate,
    isDeleting: deleteTaskMutation.isPending,
    isUpdating: updateTaskMutation.isPending,
  };
};

// Export the Task type for other components to use
export type { Task, TaskStatus } from '@/types/task';
