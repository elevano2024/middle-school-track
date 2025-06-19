
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ClipboardList, Loader2 } from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';
import TaskCard from './TaskCard';

const StudentDashboard = () => {
  const { tasks, loading, error, updateTaskStatus } = useTasks();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p>Loading your activities...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Alert className="max-w-md">
          <AlertDescription>
            {error instanceof Error ? error.message : 'Failed to load your activities. Please try again.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">My Learning Activities</h1>
            <p className="text-gray-600">Complete your assigned activities at your own pace</p>
          </div>
          
          <Alert>
            <ClipboardList className="h-4 w-4" />
            <AlertDescription>
              No activities assigned yet. Check back later for new learning opportunities!
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // Convert tasks to the format expected by TaskCard
  const convertedTasks = tasks.map(task => ({
    id: task.id,
    title: task.title,
    description: task.description || '',
    studentId: task.student_id,
    subject: task.subjects?.name || 'No Subject',
    status: task.status,
    timeInStatus: task.time_in_status || 0,
    createdAt: task.created_at
  }));

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Learning Activities</h1>
          <p className="text-gray-600">Complete your assigned activities at your own pace</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {convertedTasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onUpdateStatus={updateTaskStatus}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
