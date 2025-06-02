
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useStudents } from '@/hooks/useStudents';
import { useSubjects } from '@/hooks/useSubjects';
import { useTasks } from '@/hooks/useTasks';
import FleetBoard from '../components/FleetBoard';
import SummaryHeader from '../components/SummaryHeader';
import { Card, CardContent } from '@/components/ui/card';

const Index = () => {
  const { user } = useAuth();
  const { isAdmin, isTeacher, loading: roleLoading } = useUserRole();
  const { students, loading: studentsLoading } = useStudents();
  const { subjects, loading: subjectsLoading } = useSubjects();
  const { tasks, loading: tasksLoading, updateTaskStatus } = useTasks();

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

  if (roleLoading) {
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

  if (studentsLoading || subjectsLoading || tasksLoading) {
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
    console.log('Transforming task:', task);
    const subjectName = task.subject?.name || 'Unassigned';
    console.log('Subject name for task:', subjectName);
    
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

  console.log('Transformed tasks:', transformedTasks);

  // Add "Unassigned" to subjects if there are tasks without subjects
  const hasUnassignedTasks = transformedTasks.some(task => task.subject === 'Unassigned');
  const allSubjects = hasUnassignedTasks ? [...subjectNames, 'Unassigned'] : subjectNames;

  const getTasksForStudent = (studentId: string) => {
    return transformedTasks.filter(task => task.studentId === studentId);
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: any) => {
    const success = await updateTaskStatus(taskId, newStatus);
    if (success) {
      console.log(`Task ${taskId} status updated to ${newStatus}`);
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
        subjects={allSubjects}
        tasks={transformedTasks}
        onUpdateTaskStatus={handleUpdateTaskStatus}
        getTasksForStudent={getTasksForStudent}
      />
    </div>
  );
};

export default Index;
