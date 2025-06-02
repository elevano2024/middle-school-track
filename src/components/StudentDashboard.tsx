
import React, { useEffect } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { useAuth } from '@/contexts/AuthContext';
import { useSubjects } from '@/hooks/useSubjects';
import StudentTaskBoard from './StudentTaskBoard';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Clock, BookOpen } from 'lucide-react';

const StudentDashboard = () => {
  const { user } = useAuth();
  const { tasks, loading: tasksLoading, error: tasksError, updateTaskStatus } = useTasks();
  const { subjects, loading: subjectsLoading } = useSubjects();

  // Add debugging to see what's happening
  useEffect(() => {
    console.log('StudentDashboard - Current user:', user);
    console.log('StudentDashboard - Tasks loaded:', tasks);
    console.log('StudentDashboard - Subjects loaded:', subjects);
  }, [user, tasks, subjects]);

  if (tasksLoading || subjectsLoading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <Clock className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
            <h3 className="text-lg font-semibold mb-2">Loading Your Dashboard</h3>
            <p className="text-gray-600">Fetching your subjects and tasks...</p>
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-lg shadow-lg">
        <div className="flex items-center space-x-3">
          <BookOpen className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold">My Learning Dashboard</h1>
            <p className="text-blue-100 mt-1">Track your progress and manage your tasks</p>
            <p className="text-xs text-blue-200 mt-1">Logged in as: {user?.email}</p>
          </div>
        </div>
      </div>

      {/* Task Board */}
      <StudentTaskBoard 
        subjects={subjects}
        tasks={tasks}
        onUpdateTaskStatus={handleUpdateTaskStatus}
      />
    </div>
  );
};

export default StudentDashboard;
