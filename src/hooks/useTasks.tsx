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
      console.log('=== COMPREHENSIVE DEBUGGING ===');
      console.log('User ID:', user.id);
      console.log('User roles:', { isAdmin, isTeacher, isStudent });
      setError(null);
      
      // Step 1: Check if there are ANY tasks in the database
      console.log('Step 1: Checking all tasks in database...');
      const { data: allTasks, error: allTasksError } = await supabase
        .from('tasks')
        .select('*');
      
      console.log('All tasks query result:', allTasks);
      console.log('All tasks query error:', allTasksError);
      console.log('Total tasks in database:', allTasks?.length || 0);
      
      if (allTasks && allTasks.length > 0) {
        console.log('Sample task data:', allTasks[0]);
        allTasks.forEach((task, index) => {
          console.log(`Task ${index + 1}: id=${task.id}, student_id="${task.student_id}", title="${task.title}"`);
        });
      }

      // Step 2: Check students table
      console.log('Step 2: Checking students table...');
      const { data: allStudents, error: studentsError } = await supabase
        .from('students')
        .select('*');
      
      console.log('All students:', allStudents);
      console.log('Students error:', studentsError);
      
      if (allStudents && allStudents.length > 0) {
        allStudents.forEach((student, index) => {
          console.log(`Student ${index + 1}: id="${student.id}", name="${student.name}", email="${student.email}"`);
        });
      }

      // Step 3: Check if current user exists in students table
      console.log('Step 3: Checking if current user exists in students table...');
      const { data: currentUserAsStudent, error: currentUserError } = await supabase
        .from('students')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      
      console.log('Current user in students table:', currentUserAsStudent);
      console.log('Current user query error:', currentUserError);

      // Step 4: Check user_roles table
      console.log('Step 4: Checking user_roles table...');
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user.id);
      
      console.log('User roles in database:', userRoles);
      console.log('User roles error:', rolesError);

      // Step 5: If there are no tasks, let's see what we can create
      if (!allTasks || allTasks.length === 0) {
        console.log('No tasks found in database. This might be expected if this is a fresh installation.');
        setTasks([]);
        return;
      }

      // Step 6: Filter tasks for current user if they are a student
      let filteredTasks = allTasks;
      if (isStudent && !isAdmin && !isTeacher) {
        console.log('Filtering tasks for student with ID:', user.id);
        filteredTasks = allTasks.filter(task => task.student_id === user.id);
        console.log('Filtered tasks for student:', filteredTasks);
      }

      // Step 7: Try to enrich with student and subject data
      if (filteredTasks.length > 0) {
        console.log('Step 7: Enriching tasks with related data...');
        const { data: enrichedTasks, error: enrichError } = await supabase
          .from('tasks')
          .select(`
            *,
            students(name, email),
            subjects(name)
          `)
          .in('id', filteredTasks.map(t => t.id))
          .order('created_at', { ascending: false });

        if (enrichError) {
          console.error('Error enriching tasks:', enrichError);
          setTasks(filteredTasks as Task[]);
        } else {
          console.log('Successfully enriched tasks:', enrichedTasks);
          setTasks(enrichedTasks || []);
        }
      } else {
        setTasks([]);
      }

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

  return { tasks, loading, error, updateTaskStatus, refetch: fetchTasks };
};
