
import React, { useEffect } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { useAuth } from '@/contexts/AuthContext';
import { useSubjects } from '@/hooks/useSubjects';
import TaskCard from './TaskCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const StudentDashboard = () => {
  const { user } = useAuth();
  const { tasks, loading: tasksLoading, updateTaskStatus } = useTasks();
  const { subjects, loading: subjectsLoading } = useSubjects();

  // Add debugging to see what's happening
  useEffect(() => {
    console.log('StudentDashboard - Current user:', user);
    console.log('StudentDashboard - Tasks loaded:', tasks);
    console.log('StudentDashboard - Tasks loading:', tasksLoading);
  }, [user, tasks, tasksLoading]);

  if (tasksLoading || subjectsLoading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <p>Loading your tasks...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  console.log('Current user email:', user?.email);
  console.log('All tasks fetched for student dashboard:', tasks);

  // Since useTasks already filters by student email, we can use tasks directly
  const studentTasks = tasks;

  console.log('Student tasks filtered by email:', studentTasks);

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

      {/* Success Message */}
      {studentTasks.length > 0 && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <h3 className="font-semibold text-green-800 mb-2">✅ Great! Your tasks are loading correctly!</h3>
            <p className="text-sm text-green-700">
              Found {studentTasks.length} task{studentTasks.length !== 1 ? 's' : ''} assigned to {user?.email}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Tasks by Subject */}
      {Object.keys(tasksBySubject).length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500">No tasks assigned yet. Check back later!</p>
            <p className="text-sm text-gray-400 mt-2">
              If you should have tasks, please contact your teacher or check that you're logged in with the correct email.
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Looking for tasks assigned to: {user?.email}
            </p>
          </CardContent>
        </Card>
      ) : (
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
      )}
    </div>
  );
};

export default StudentDashboard;
