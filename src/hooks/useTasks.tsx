
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
  const [error, setError] = useState<string | null>(null);
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
      console.log('=== FETCHING TASKS WITH SUBJECT DATA ===');
      console.log('User ID:', user.id);
      console.log('User roles:', { isAdmin, isTeacher, isStudent });
      setError(null);
      
      // Build the query based on user role
      let query = supabase
        .from('tasks')
        .select(`
          *,
          students(name, email),
          subjects(name)
        `)
        .order('created_at', { ascending: false });

      // Filter by student ID if the user is a student (but not admin/teacher)
      if (isStudent && !isAdmin && !isTeacher) {
        console.log('Filtering tasks for student with ID:', user.id);
        query = query.eq('student_id', user.id);
      }

      const { data: tasksData, error: fetchError } = await query;

      if (fetchError) {
        console.error('Error fetching tasks:', fetchError);
        setError('Failed to fetch tasks');
        return;
      }

      console.log('Raw tasks data from database:', tasksData);

      // If we got tasks but subjects are null, let's fetch subjects separately
      if (tasksData && tasksData.length > 0) {
        // Check if any tasks have null subjects
        const tasksWithNullSubjects = tasksData.filter(task => !task.subjects);
        
        if (tasksWithNullSubjects.length > 0) {
          console.log('Some tasks have null subjects, fetching subjects separately...');
          
          // Get all unique subject IDs
          const subjectIds = [...new Set(tasksData.map(task => task.subject_id))];
          
          // Fetch subjects separately
          const { data: subjectsData, error: subjectsError } = await supabase
            .from('subjects')
            .select('id, name')
            .in('id', subjectIds);

          if (subjectsError) {
            console.error('Error fetching subjects:', subjectsError);
          } else {
            console.log('Fetched subjects separately:', subjectsData);
            
            // Map subjects back to tasks
            const enrichedTasks = tasksData.map(task => ({
              ...task,
              subjects: task.subjects || subjectsData?.find(s => s.id === task.subject_id) || null
            }));
            
            console.log('Enriched tasks with subjects:', enrichedTasks);
            setTasks(enrichedTasks);
            return;
          }
        }
      }

      console.log('Final tasks data:', tasksData);
      setTasks(tasksData || []);

    } catch (error) {
      console.error('Error in fetchTasks:', error);
      setError('Failed to fetch tasks');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('useTasks effect triggered - user:', user?.id, 'roles:', { isAdmin, isTeacher, isStudent }, 'roleLoading:', roleLoading);
    
    // Fetch tasks if we have a user and roles have finished loading
    if (user && !roleLoading) {
      fetchTasks();
    } else if (!user) {
      setLoading(false);
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
    
    const channel = supabase
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

    channelRef.current = channel;

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

  return { tasks, loading, error, updateTaskStatus, refetch: fetchTasks };
};
