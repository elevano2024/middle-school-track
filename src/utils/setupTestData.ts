
import { supabase } from '@/integrations/supabase/client';

export const setupStudentTestData = async () => {
  try {
    console.log('Setting up test data for student...');

    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('No authenticated user found');
      return;
    }

    console.log('Current user email:', user.email);

    // First, let's get all subjects to create tasks for each one
    const { data: subjects, error: subjectsError } = await supabase
      .from('subjects')
      .select('*');

    if (subjectsError) {
      console.error('Error fetching subjects:', subjectsError);
      return;
    }

    console.log('Available subjects:', subjects);

    // Get the user's profile to find their name
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    const userName = profile?.full_name || 'Ravi Singh';

    // Check if the student user already exists in the students table by email
    const { data: existingStudent, error: studentCheckError } = await supabase
      .from('students')
      .select('*')
      .eq('email', user.email)
      .single();

    let studentId;

    if (studentCheckError && studentCheckError.code === 'PGRST116') {
      // Student doesn't exist, create them with email
      console.log('Creating student record for:', userName, 'with email:', user.email);
      const { data: newStudent, error: createStudentError } = await supabase
        .from('students')
        .insert({
          name: userName,
          email: user.email,
          grade: '8'
        })
        .select()
        .single();

      if (createStudentError) {
        console.error('Error creating student:', createStudentError);
        return;
      }

      studentId = newStudent.id;
      console.log('Created student with ID:', studentId);
    } else if (existingStudent) {
      studentId = existingStudent.id;
      console.log('Using existing student with ID:', studentId);
    }

    // Check if tasks already exist for this student
    const { data: existingTasks, error: tasksCheckError } = await supabase
      .from('tasks')
      .select('*')
      .eq('student_id', studentId);

    if (tasksCheckError) {
      console.error('Error checking existing tasks:', tasksCheckError);
      return;
    }

    if (existingTasks && existingTasks.length > 0) {
      console.log('Tasks already exist for this student:', existingTasks.length);
      return;
    }

    // Create tasks for each subject
    const tasksToCreate = subjects?.map((subject) => ({
      title: `${subject.name} Assignment`,
      description: `Complete the ${subject.name} worksheets and practice problems`,
      student_id: studentId,
      subject_id: subject.id,
      status: 'working' as const,
      time_in_status: Math.floor(Math.random() * 30) + 5 // Random time between 5-35 minutes
    })) || [];

    if (tasksToCreate.length > 0) {
      const { data: createdTasks, error: createTasksError } = await supabase
        .from('tasks')
        .insert(tasksToCreate)
        .select();

      if (createTasksError) {
        console.error('Error creating tasks:', createTasksError);
        return;
      }

      console.log('Created tasks:', createdTasks);
    }

    console.log('Test data setup complete!');
  } catch (error) {
    console.error('Error setting up test data:', error);
  }
};
