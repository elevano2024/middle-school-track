import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useStudents } from '@/hooks/useStudents';
import { useSubjects } from '@/hooks/useSubjects';
import { useTasks } from '@/hooks/useTasks';
import { useAttendance } from '@/hooks/useAttendance';
import FleetBoard from '../components/FleetBoard';
import SummaryHeader from '../components/SummaryHeader';
import StudentDashboard from '../components/StudentDashboard';
import { Card, CardContent } from '@/components/ui/card';
import { TaskStatus } from '@/types/task';

const Index = () => {
  const { user } = useAuth();
  const { isAdmin, isTeacher, isStudent, loading: roleLoading } = useUserRole();
  const { students, loading: studentsLoading } = useStudents();
  const { subjects, loading: subjectsLoading } = useSubjects();
  const { tasks, loading: tasksLoading, updateTaskStatus } = useTasks();
  const { loading: attendanceLoading } = useAttendance(); // Initialize attendance hook

  // Add debugging for subjects data
  React.useEffect(() => {
    console.log('Index: User roles:', { isAdmin, isTeacher, isStudent });
    console.log('Index: Subjects data:', subjects);
    console.log('Index: Subjects loading:', subjectsLoading);
    console.log('Index: Tasks data length:', tasks.length);
    console.log('Index: Tasks loading:', tasksLoading);
  }, [isAdmin, isTeacher, isStudent, subjects, subjectsLoading, tasks, tasksLoading]);

  if (!user) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <p>Please sign in to access the student tracker.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (roleLoading || studentsLoading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <p>Loading your permissions...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if the current user exists in the students table
  const currentUserAsStudent = students.find(student => student.id === user.id);
  
  // Show student dashboard if:
  // 1. User has student role, OR
  // 2. User exists in the students table (even if they're admin/teacher)
  if (isStudent || currentUserAsStudent) {
    console.log('Index: Showing student dashboard for user:', user.id);
    console.log('Index: User is student:', isStudent);
    console.log('Index: User exists in students table:', !!currentUserAsStudent);
    return <StudentDashboard />;
  }

  // Show fleet board for teachers and admins who are not students
  if (!isAdmin && !isTeacher) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <p>You don't have permission to access the student tracker. Please contact an administrator to assign you the appropriate role.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (subjectsLoading || tasksLoading || attendanceLoading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <p>Loading student data...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Transform data to match the existing component interfaces
  const transformedStudents = students.map(student => ({
    id: student.id,
    name: student.name,
    grade: parseInt(student.grade)
  }));

  const subjectNames = subjects.map(subject => subject.name);

  const transformedTasks = tasks.map(task => {
    console.log('Index: Raw task data:', task);
    
    // The subject data comes from the join and might be nested differently
    // Let's try multiple ways to access it
    let subjectName = '';
    
    if (task.subjects?.name) {
      subjectName = task.subjects.name;
    } else {
      // If no subject name found in joined data, try to find it by subject_id
      const subject = subjects.find(s => s.id === task.subject_id);
      subjectName = subject?.name || '';
    }
    
    console.log('Index: Final subject name for task:', subjectName);
    
    return {
      id: task.id,
      title: task.title,
      description: task.description || '',
      studentId: task.student_id,
      subject: subjectName,
      status: task.status,
      timeInStatus: task.time_in_status || 0,
      createdAt: task.created_at
    };
  });

  console.log('Index: Final transformed tasks:', transformedTasks);

  const getTasksForStudent = (studentId: string) => {
    return transformedTasks.filter(task => task.studentId === studentId);
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: TaskStatus): Promise<boolean> => {
    console.log(`Index: Attempting to update task ${taskId} to status ${newStatus}`);
    const success = await updateTaskStatus(taskId, newStatus);
    if (success) {
      console.log(`Index: Task ${taskId} status updated to ${newStatus}`);
      return true;
    } else {
      console.error(`Index: Failed to update task ${taskId} status to ${newStatus}`);
      return false;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Student Progress Overview</h1>
      </div>
      
      <SummaryHeader tasks={transformedTasks} />
      <FleetBoard 
        students={transformedStudents}
        subjects={subjectNames}
        tasks={transformedTasks}
        onUpdateTaskStatus={handleUpdateTaskStatus}
        getTasksForStudent={getTasksForStudent}
      />
    </div>
  );
};

export default Index;
