import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ClipboardList, FilterX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTasks } from '@/hooks/useTasks';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TaskStatus } from '@/types/task';
import TaskCard from './TaskCard';
import SummaryHeader from './SummaryHeader';

type StatusFilter = TaskStatus | 'all';

const StudentDashboard = () => {
  const { tasks, error, updateTaskStatus } = useTasks();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Alert className="max-w-md mx-4">
          <AlertDescription>
            {error instanceof Error ? error.message : 'Failed to load your activities. Please try again.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50" style={{ width: '100%' }}>
        <div className="w-full px-6 py-6">
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

  // Filter tasks based on selected status
  const filteredTasks = statusFilter === 'all' 
    ? convertedTasks 
    : convertedTasks.filter(task => task.status === statusFilter);

  // Group filtered tasks by subject
  const tasksBySubject = filteredTasks.reduce((acc, task) => {
    const subjectName = task.subject;
    if (!acc[subjectName]) {
      acc[subjectName] = [];
    }
    acc[subjectName].push(task);
    return acc;
  }, {} as Record<string, typeof convertedTasks>);

  // Get all subjects that have filtered tasks
  const subjectsWithTasks = Object.keys(tasksBySubject).sort();

  // Handle status filter changes
  const handleStatusFilterChange = (status: StatusFilter) => {
    setStatusFilter(status);
  };

  // Clear filter
  const clearFilter = () => {
    setStatusFilter('all');
  };

  // Get filter display text
  const getFilterDisplayText = () => {
    switch (statusFilter) {
      case 'working': return 'Working';
      case 'need-help': return 'Need Help';
      case 'ready-review': return 'Ready for Review';
      case 'completed': return 'Completed';
      default: return 'All Tasks';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50" style={{ width: '100%' }}>
      <div className="w-full px-6 py-6 space-y-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Learning Dashboard</h1>
          <p className="text-gray-600">Track your progress and update your task status</p>
        </div>

        <SummaryHeader 
          tasks={convertedTasks} 
          onStatusFilter={handleStatusFilterChange}
          activeFilter={statusFilter}
        />

        {/* Filter Status Bar */}
        {statusFilter !== 'all' && (
          <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-blue-900">
                Showing: <span className="font-bold">{getFilterDisplayText()}</span> tasks
              </span>
              <span className="text-sm text-blue-700">
                {filteredTasks.length} of {convertedTasks.length} tasks
              </span>
            </div>
            <Button
              onClick={clearFilter}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              <FilterX className="w-4 h-4" />
              Show All Tasks
            </Button>
          </div>
        )}

        <Card className="w-full">
          <CardContent className="p-6">
            {subjectsWithTasks.length > 0 ? (
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
            ) : statusFilter !== 'all' ? (
              <div className="text-center py-8">
                <ClipboardList className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No {getFilterDisplayText().toLowerCase()} tasks found
                </h3>
                <p className="text-gray-500 mb-4">
                  You don't have any tasks with "{getFilterDisplayText().toLowerCase()}" status right now.
                </p>
                <Button onClick={clearFilter} variant="outline">
                  <FilterX className="w-4 h-4 mr-2" />
                  Show All Tasks
                </Button>
              </div>
            ) : (
              <Alert>
                <ClipboardList className="h-4 w-4" />
                <AlertDescription>
                  No tasks found for any subjects. Check back later for new assignments!
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentDashboard;
