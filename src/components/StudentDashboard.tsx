
import React, { useEffect } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { useAuth } from '@/contexts/AuthContext';
import { useSubjects } from '@/hooks/useSubjects';
import TaskCard from './TaskCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Clock, HelpCircle } from 'lucide-react';

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
  }, [user, tasks, tasksLoading, tasksError]);

  if (tasksLoading || subjectsLoading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 animate-spin" />
              <p>Loading your tasks...</p>
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

  // Since useTasks already filters by student ID, we can use tasks directly
  const studentTasks = tasks;

  console.log('Student tasks (should be filtered by user ID):', studentTasks);

  // Group tasks by subject
  const tasksBySubject = studentTasks.reduce((acc, task) => {
    const subjectName = task.subjects?.name || 'Unknown Subject';
    if (!acc[subjectName]) {
      acc[subjectName] = [];
    }
    acc[subjectName].push(task);
    return acc;
  }, {} as Record<string, typeof tasks>);

  const handleUpdateTaskStatus = async (taskId: string, newStatus: any) => {
    console.log(`Student updating task ${taskId} to status ${newStatus}`);
    const success = await updateTaskStatus(taskId, newStatus);
    if (success) {
      console.log(`Task ${taskId} status updated to ${newStatus}`);
    } else {
      console.error(`Failed to update task ${taskId} status to ${newStatus}`);
    }
  };

  const getStatusCounts = () => {
    const counts = {
      working: 0,
      'need-help': 0,
      'ready-review': 0,
      completed: 0
    };
    
    studentTasks.forEach(task => {
      counts[task.status as keyof typeof counts]++;
    });
    
    return counts;
  };

  const statusCounts = getStatusCounts();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Learning Dashboard</h1>
        <p className="text-gray-600 mt-1">Track your progress and update your task status</p>
        <p className="text-sm text-gray-500 mt-1">Logged in as: {user?.email}</p>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{statusCounts.working}</div>
            <div className="text-sm text-gray-600">Working</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{statusCounts['need-help']}</div>
            <div className="text-sm text-gray-600">Need Help</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{statusCounts['ready-review']}</div>
            <div className="text-sm text-gray-600">Ready for Review</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{statusCounts.completed}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks by Subject */}
      {Object.keys(tasksBySubject).length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No tasks assigned yet</h3>
            <p className="text-gray-500 mb-4">Check back later or contact your teacher if you think you should have tasks assigned.</p>
            
            <div className="bg-gray-50 p-4 rounded-lg text-left">
              <h4 className="font-semibold text-gray-700 mb-2">Debug Information:</h4>
              <div className="text-xs text-gray-600 space-y-1">
                <p><strong>User ID:</strong> {user?.id}</p>
                <p><strong>Email:</strong> {user?.email}</p>
                <p><strong>Total tasks found:</strong> {studentTasks.length}</p>
                <p><strong>Looking for tasks with student_id:</strong> {user?.id}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Success Message */}
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Great! Found {studentTasks.length} task{studentTasks.length !== 1 ? 's' : ''} assigned to your account.
            </AlertDescription>
          </Alert>

          {/* Tasks organized by subject */}
          <div className="space-y-6">
            {Object.entries(tasksBySubject).map(([subjectName, subjectTasks]) => (
              <Card key={subjectName}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <span className="text-lg font-semibold">{subjectName}</span>
                    <span className="ml-2 text-sm bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                      {subjectTasks.length} task{subjectTasks.length !== 1 ? 's' : ''}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {subjectTasks.map(task => {
                      // Transform task to match TaskCard interface
                      const transformedTask = {
                        id: task.id,
                        title: task.title,
                        description: task.description || '',
                        studentId: task.student_id,
                        subject: subjectName,
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
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default StudentDashboard;
