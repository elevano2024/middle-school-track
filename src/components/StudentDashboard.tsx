
import React, { useEffect } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { useAuth } from '@/contexts/AuthContext';
import TaskCard from './TaskCard';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Clock, HelpCircle } from 'lucide-react';

const StudentDashboard = () => {
  const { user } = useAuth();
  const { tasks, loading: tasksLoading, error: tasksError, updateTaskStatus } = useTasks();

  // Add debugging to see what's happening
  useEffect(() => {
    console.log('StudentDashboard - Current user:', user);
    console.log('StudentDashboard - Tasks loaded:', tasks);
    console.log('StudentDashboard - Tasks loading:', tasksLoading);
  }, [user, tasks, tasksLoading]);

  if (tasksLoading) {
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

  const handleUpdateTaskStatus = async (taskId: string, newStatus: any) => {
    console.log(`Student updating task ${taskId} to status ${newStatus}`);
    const success = await updateTaskStatus(taskId, newStatus);
    if (success) {
      console.log(`Task ${taskId} status updated to ${newStatus}`);
    } else {
      console.error(`Failed to update task ${taskId} status to ${newStatus}`);
    }
  };

  // If no tasks at all
  if (tasks.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Learning Dashboard</h1>
          <p className="text-gray-600 mt-1">Track your progress and update your task status</p>
          <p className="text-sm text-gray-500 mt-1">Logged in as: {user?.email}</p>
        </div>

        <Card>
          <CardContent className="p-6 text-center">
            <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No tasks found</h3>
            <p className="text-gray-500 mb-4">Check back later or contact your teacher if you think you should have tasks assigned.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Group tasks by subject
  const tasksBySubject = tasks.reduce((acc, task) => {
    const subjectName = task.subjects?.name || 'Unknown Subject';
    const subjectId = task.subject_id;
    
    if (!acc[subjectId]) {
      acc[subjectId] = {
        name: subjectName,
        tasks: []
      };
    }
    acc[subjectId].tasks.push(task);
    return acc;
  }, {} as Record<string, { name: string; tasks: typeof tasks }>);

  const subjects = Object.entries(tasksBySubject);

  console.log('Grouped tasks by subject:', tasksBySubject);

  // Main board view with subjects and tasks
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Learning Dashboard</h1>
        <p className="text-gray-600 mt-1">Track your progress and update your task status</p>
        <p className="text-sm text-gray-500 mt-1">Logged in as: {user?.email}</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {subjects.map(([subjectId, subjectData]) => (
                  <th key={subjectId} className="px-4 py-3 text-center text-sm font-medium text-gray-900 border-r border-gray-200 min-w-[200px]">
                    {subjectData.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {subjects.map(([subjectId, subjectData]) => (
                  <td key={subjectId} className="px-2 py-4 border-r border-gray-200 min-h-[200px] align-top">
                    <div className="space-y-2">
                      {subjectData.tasks.map(task => {
                        const transformedTask = {
                          id: task.id,
                          title: task.title,
                          description: task.description || '',
                          studentId: task.student_id,
                          subject: subjectData.name,
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
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
