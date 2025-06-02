
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
  };
  subject?: {
    name: string;
  };
}

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { isAdmin, isTeacher } = useUserRole();
  const channelRef = useRef<any>(null);

  const fetchTasks = async () => {
    if (!user || (!isAdmin && !isTeacher)) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          students(name),
          subjects(name)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tasks:', error);
      } else {
        console.log('Fetched tasks:', data);
        setTasks(data || []);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [user, isAdmin, isTeacher]);

  // Set up real-time subscription with proper cleanup
  useEffect(() => {
    if (!user || (!isAdmin && !isTeacher)) return;

    // Clean up existing channel if it exists
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Create new channel
    channelRef.current = supabase
      .channel('tasks-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        console.log('Tasks data changed, refetching...');
        fetchTasks();
      })
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user, isAdmin, isTeacher]);

  const updateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    try {
      console.log(`Updating task ${taskId} status to ${newStatus}`);
      
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
        return false;
      }

      console.log(`Successfully updated task ${taskId} status to ${newStatus}`);
      
      // The real-time subscription will automatically refresh the data
      return true;
    } catch (error) {
      console.error('Error updating task status:', error);
      return false;
    }
  };

  return { tasks, loading, updateTaskStatus, refetch: fetchTasks };
};
