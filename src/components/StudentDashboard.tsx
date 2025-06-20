
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ClipboardList } from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';
import { useSubjects } from '@/hooks/useSubjects';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import TaskCard from './TaskCard';
import TaskCardSkeleton from './TaskCardSkeleton';
import LoadingSpinner from './LoadingSpinner';
import SummaryHeader from './SummaryHeader';

const StudentDashboard = () => {
  const { tasks, loading, error, updateTaskStatus } = useTasks();
  const { subjects, loading: subjectsLoading } = useSubjects();

  if (loading || subjectsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">My Learning Dashboard</h1>
            <p className="text-gray-600">Track your progress and update your task status</p>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <TaskCardSkeleton key={index} />
            ))}
          </div>
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
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">My Learning Dashboard</h1>
            <p className="text-gray-600">Track your progress and update your task status</p>
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

  // Convert tasks to the format expected by components
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

  // Group tasks by subject
  const tasksBySubject = convertedTasks.reduce((acc, task) => {
    const subjectName = task.subject;
    if (!acc[subjectName]) {
      acc[subjectName] = [];
    }
    acc[subjectName].push(task);
    return acc;
  }, {} as Record<string, typeof convertedTasks>);

  // Get all subjects that have tasks assigned
  const subjectsWithTasks = Object.keys(tasksBySubject).sort();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-full mx-auto space-y-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Learning Dashboard</h1>
          <p className="text-gray-600">Track your progress and update your task status</p>
        </div>

        {/* Summary Header */}
        <SummaryHeader tasks={convertedTasks} />

        {/* Table Layout - Original Design */}
        <Card className="w-full">
          <CardContent className="p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  {subjectsWithTasks.map(subject => (
                    <TableHead key={subject} className="text-center font-semibold">
                      {subject}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  {subjectsWithTasks.map(subject => (
                    <TableCell key={subject} className="align-top p-4">
                      <div className="space-y-3">
                        {tasksBySubject[subject].map(task => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            onUpdateStatus={updateTaskStatus}
                          />
                        ))}
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {subjectsWithTasks.length === 0 && (
          <Alert>
            <ClipboardList className="h-4 w-4" />
            <AlertDescription>
              No tasks found for any subjects. Check back later for new assignments!
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
