
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { TaskStatus } from '@/types/workflow';

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

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { isAdmin, isTeacher, isStudent, loading: roleLoading } = useUserRole();
  const channelRef = useRef<any>(null);
  const updatingTasksRef = useRef<Set<string>>(new Set());

  const fetchTasks = async () => {
    if (!user) {
      console.log('No user found, skipping task fetch');
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching tasks for user:', user.id, 'with roles:', { isAdmin, isTeacher, isStudent });
      
      let query = supabase
        .from('tasks')
        .select(`
          *,
          students(name, email),
          subjects(name)
        `);

      // If user is a student, filter by their user ID directly as student_id
      if (isStudent && !isAdmin && !isTeacher) {
        console.log('Fetching tasks for student with user ID:', user.id);
        query = query.eq('student_id', user.id);
      }

      query = query.order('created_at', { ascending: false });

      console.log('About to execute query...');
      const { data, error } = await query;

      if (error) {
        console.error('Error fetching tasks:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
      } else {
        console.log('Successfully fetched tasks:', data);
        console.log('Number of tasks fetched:', data?.length || 0);
        setTasks(data || []);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('useTasks effect triggered - user:', user?.id, 'roles:', { isAdmin, isTeacher, isStudent }, 'roleLoading:', roleLoading);
    
    // Fetch tasks if we have a user and roles have finished loading
    if (user && !roleLoading) {
      fetchTasks();
    }
  }, [user, isAdmin, isTeacher, isStudent, roleLoading]);

  // Set up real-time subscription with proper cleanup
  useEffect(() => {
    if (!user) return;

    // Clean up existing channel if it exists
    if (channelRef.current) {
      console.log('Removing existing channel before creating new one');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Create new channel with a unique name to avoid conflicts
    const channelName = `tasks-changes-${user.id}-${Date.now()}`;
    console.log('Creating new channel:', channelName);
    
    channelRef.current = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload) => {
        console.log('Tasks data changed via real-time:', payload);
        
        // Only refetch if this wasn't an update we initiated
        const taskId = (payload.new as any)?.id || (payload.old as any)?.id;
        if (taskId && !updatingTasksRef.current.has(taskId)) {
          console.log('Refetching tasks due to external change');
          fetchTasks();
        } else {
          console.log('Skipping refetch for self-initiated update');
        }
      })
      .subscribe((status) => {
        console.log('Channel subscription status:', status);
      });

    return () => {
      if (channelRef.current) {
        console.log('Cleaning up channel on unmount');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user?.id]);

  const updateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    // Prevent duplicate updates
    if (updatingTasksRef.current.has(taskId)) {
      console.log(`Task ${taskId} is already being updated, skipping`);
      return false;
    }

    try {
      console.log(`Updating task ${taskId} status to ${newStatus}`);
      updatingTasksRef.current.add(taskId);
      
      // Optimistically update local state first for immediate UI feedback
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId 
            ? { ...task, status: newStatus, time_in_status: 0, updated_at: new Date().toISOString() }
            : task
        )
      );

      const { error } = await supabase
        .from('tasks')
        .update({ 
          status: newStatus, 
          time_in_status: 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId);

      if (error) {
        console.error('Error updating task status:', error);
        // Revert optimistic update on error
        fetchTasks();
        return false;
      }

      console.log(`Successfully updated task ${taskId} status to ${newStatus}`);
      return true;
    } catch (error) {
      console.error('Error updating task status:', error);
      // Revert optimistic update on error
      fetchTasks();
      return false;
    } finally {
      // Remove from updating set after a brief delay to prevent race conditions
      setTimeout(() => {
        updatingTasksRef.current.delete(taskId);
      }, 1000);
    }
  };

  return { tasks, loading, updateTaskStatus, refetch: fetchTasks };
};
