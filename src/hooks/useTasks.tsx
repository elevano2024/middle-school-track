
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
      console.log('=== FETCHING TASKS ===');
      console.log('User ID:', user.id);
      console.log('User roles:', { isAdmin, isTeacher, isStudent });
      setError(null);
      
      // First, fetch all subjects separately
      const { data: subjectsData, error: subjectsError } = await supabase
        .from('subjects')
        .select('id, name');

      if (subjectsError) {
        console.error('Error fetching subjects:', subjectsError);
        setError('Failed to fetch subjects');
        return;
      }

      console.log('Fetched subjects:', subjectsData);
      console.log('Subject IDs in database:', subjectsData?.map(s => s.id));

      // Create a lookup map for subjects
      const subjectsMap = (subjectsData || []).reduce((acc, subject) => {
        acc[subject.id] = subject;
        return acc;
      }, {} as Record<string, { id: string; name: string }>);

      console.log('Subjects map keys:', Object.keys(subjectsMap));

      // Build the tasks query based on user role
      let query = supabase
        .from('tasks')
        .select(`
          *,
          students(name, email)
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
      console.log('Task subject_ids:', tasksData?.map(t => t.subject_id));

      if (!tasksData || tasksData.length === 0) {
        console.log('No tasks found');
        setTasks([]);
        return;
      }

      // Check for subject_id mismatches BEFORE mapping
      const uniqueTaskSubjectIds = [...new Set(tasksData.map(t => t.subject_id))];
      const availableSubjectIds = Object.keys(subjectsMap);
      
      console.log('Unique subject IDs in tasks:', uniqueTaskSubjectIds);
      console.log('Available subject IDs in subjects table:', availableSubjectIds);
      
      const missingSubjectIds = uniqueTaskSubjectIds.filter(id => !availableSubjectIds.includes(id));
      console.log('Subject IDs that exist in tasks but NOT in subjects table:', missingSubjectIds);

      // Manually attach subject data to each task
      const tasksWithSubjects = tasksData.map(task => {
        const subjectData = subjectsMap[task.subject_id];
        console.log(`Task ${task.id} (${task.title}) - subject_id: ${task.subject_id}, found subject:`, subjectData);
        
        return {
          ...task,
          subjects: subjectData ? { name: subjectData.name } : null
        };
      });

      console.log('Tasks with manually attached subjects:', tasksWithSubjects);
      
      // Verify the subject attachment worked
      const tasksWithSubjectNames = tasksWithSubjects.filter(task => task.subjects?.name);
      const tasksWithoutSubjectNames = tasksWithSubjects.filter(task => !task.subjects?.name);
      
      console.log('Tasks with subject names:', tasksWithSubjectNames.length);
      console.log('Tasks without subject names:', tasksWithoutSubjectNames.length);
      
      if (tasksWithoutSubjectNames.length > 0) {
        console.log('Tasks missing subject data:', tasksWithoutSubjectNames.map(t => ({ 
          id: t.id, 
          title: t.title,
          subject_id: t.subject_id, 
          available_subjects: Object.keys(subjectsMap)
        })));
      }
      
      setTasks(tasksWithSubjects);

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

  // Set up real-time subscription only if user exists
  useEffect(() => {
    if (!user) return;

    // Clean up existing channel if it exists
    if (channelRef.current) {
      console.log('Removing existing channel before creating new one');
      try {
        supabase.removeChannel(channelRef.current);
      } catch (error) {
        console.log('Error removing channel:', error);
      }
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
        try {
          supabase.removeChannel(channelRef.current);
        } catch (error) {
          console.log('Error cleaning up channel:', error);
        }
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
