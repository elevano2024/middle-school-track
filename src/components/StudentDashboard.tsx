
import React, { useEffect } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { useAuth } from '@/contexts/AuthContext';
import { useSubjects } from '@/hooks/useSubjects';
import TaskCard from './TaskCard';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Clock, HelpCircle } from 'lucide-react';

const StudentDashboard = () => {
  const { user } = useAuth();
  const { tasks, loading: tasksLoading, error: tasksError, updateTaskStatus } = useTasks();
  const { subjects, loading: subjectsLoading } = useSubjects();

  // Add debugging to see what's happening
  useEffect(() => {
    console.log('StudentDashboard - Current user:', user);
    console.log('StudentDashboard - User ID:', user?.id);
    console.log('StudentDashboard - User email:', user?.email);
    console.log('StudentDashboard - Tasks loaded:', tasks);
    console.log('StudentDashboard - Tasks loading:', tasksLoading);
    console.log('StudentDashboard - Tasks error:', tasksError);
    console.log('StudentDashboard - Subjects loaded:', subjects);
    console.log('StudentDashboard - Subjects loading:', subjectsLoading);
  }, [user, tasks, tasksLoading, tasksError, subjects, subjectsLoading]);

  if (tasksLoading || subjectsLoading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 animate-spin" />
              <p>Loading your tasks and subjects...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error if there's a tasks error
  if (tasksError) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {tasksError}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  console.log('Current user ID:', user?.id);
  console.log('Current user email:', user?.email);
  console.log('All tasks fetched for student dashboard:', tasks);
  console.log('All subjects fetched:', subjects);

  // Since useTasks already filters by student ID, we can use tasks directly
  const studentTasks = tasks;

  console.log('Student tasks (should be filtered by user ID):', studentTasks);

  const handleUpdateTaskStatus = async (taskId: string, newStatus: any) => {
    console.log(`Student updating task ${taskId} to status ${newStatus}`);
    const success = await updateTaskStatus(taskId, newStatus);
    if (success) {
      console.log(`Task ${taskId} status updated to ${newStatus}`);
    } else {
      console.error(`Failed to update task ${taskId} status to ${newStatus}`);
    }
  };

  // Get tasks for a specific subject
  const getTasksForSubject = (subjectName: string) => {
    return studentTasks.filter(task => {
      // Try to find subject name from subjects array
      const subject = subjects.find(s => s.id === task.subject_id);
      const taskSubjectName = subject?.name || 'Unknown Subject';
      return taskSubjectName === subjectName;
    });
  };

  // Only show subjects that have tasks assigned
  const subjectsWithTasks = subjects.filter(subject => {
    const subjectTasks = getTasksForSubject(subject.name);
    return subjectTasks.length > 0;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Learning Dashboard</h1>
        <p className="text-gray-600 mt-1">Track your progress and update your task status</p>
        <p className="text-sm text-gray-500 mt-1">Logged in as: {user?.email}</p>
      </div>

      {subjectsWithTasks.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No tasks found</h3>
            <p className="text-gray-500 mb-4">Check back later or contact your teacher if you think you should have tasks assigned.</p>
            
            <div className="bg-gray-50 p-4 rounded-lg text-left">
              <h4 className="font-semibold text-gray-700 mb-2">Debug Information:</h4>
              <div className="text-xs text-gray-600 space-y-1">
                <p><strong>User ID:</strong> {user?.id}</p>
                <p><strong>Email:</strong> {user?.email}</p>
                <p><strong>Total tasks found:</strong> {studentTasks.length}</p>
                <p><strong>Total subjects found:</strong> {subjects.length}</p>
                <p><strong>Looking for tasks with student_id:</strong> {user?.id}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {subjectsWithTasks.map(subject => (
                    <th key={subject.id} className="px-4 py-3 text-center text-sm font-medium text-gray-900 border-r border-gray-200 min-w-[200px]">
                      {subject.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {subjectsWithTasks.map(subject => {
                    const subjectTasks = getTasksForSubject(subject.name);
                    return (
                      <td key={subject.id} className="px-2 py-4 border-r border-gray-200 min-h-[200px] align-top">
                        <div className="space-y-2">
                          {subjectTasks.map(task => {
                            // Transform task to match TaskCard interface
                            const transformedTask = {
                              id: task.id,
                              title: task.title,
                              description: task.description || '',
                              studentId: task.student_id,
                              subject: subject.name,
                              status: task.status,
                              timeInStatus: task.time_in_status || 0,
                              createdAt: task.created_at
                            };

                            return (
                              <TaskCard
                                key={task.id}
                                task={transformedTask}
                                onUpdateStatus={handleUpdateTaskStatus}
                              />
                            );
                          })}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
