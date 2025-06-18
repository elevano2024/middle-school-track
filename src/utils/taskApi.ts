
import { supabase } from '@/integrations/supabase/client';
import { TaskStatus } from '@/types/task';

export const fetchTasksFromDatabase = async (userId: string, isStudent: boolean, isAdmin: boolean, isTeacher: boolean) => {
  console.log('=== FETCHING TASKS ===');
  console.log('User ID:', userId);
  console.log('User roles:', { isAdmin, isTeacher, isStudent });
  
  // Build the tasks query with proper joins
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
    console.log('Filtering tasks for student with ID:', userId);
    query = query.eq('student_id', userId);
  }

  const { data: tasksData, error: fetchError } = await query;

  if (fetchError) {
    console.error('Error fetching tasks:', fetchError);
    throw new Error('Failed to fetch tasks');
  }

  console.log('Successfully fetched tasks with subjects:', tasksData);

  if (!tasksData || tasksData.length === 0) {
    console.log('No tasks found');
    return [];
  }

  // Verify that subjects are properly joined
  const tasksWithSubjectNames = tasksData.filter(task => task.subjects?.name);
  const tasksWithoutSubjectNames = tasksData.filter(task => !task.subjects?.name);
  
  console.log('Tasks with subject names:', tasksWithSubjectNames.length);
  console.log('Tasks without subject names:', tasksWithoutSubjectNames.length);
  
  if (tasksWithoutSubjectNames.length > 0) {
    console.log('Tasks missing subject data:', tasksWithoutSubjectNames.map(t => ({ 
      id: t.id, 
      title: t.title,
      subject_id: t.subject_id
    })));
  }
  
  return tasksData;
};

export const updateTaskStatusInDatabase = async (taskId: string, newStatus: TaskStatus) => {
  console.log(`=== UPDATING TASK STATUS ===`);
  console.log(`Task ID: ${taskId}`);
  console.log(`New Status: ${newStatus}`);
  
  const { data, error } = await supabase
    .from('tasks')
    .update({ 
      status: newStatus, 
      time_in_status: 0,
      updated_at: new Date().toISOString()
    })
    .eq('id', taskId)
    .select(); // Add select to return the updated row

  if (error) {
    console.error('=== ERROR UPDATING TASK STATUS ===');
    console.error('Error details:', error);
    throw new Error(`Failed to update task status: ${error.message}`);
  }

  console.log('=== TASK STATUS UPDATE SUCCESSFUL ===');
  console.log('Updated task data:', data);
  
  return true;
};
