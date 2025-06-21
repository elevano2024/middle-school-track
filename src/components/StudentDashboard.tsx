import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ClipboardList, FilterX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTasks } from '@/hooks/useTasks';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { TaskStatus } from '@/types/task';
import TaskCard from './TaskCard';
import SummaryHeader from './SummaryHeader';

type StatusFilter = TaskStatus | 'all';

const StudentDashboard = () => {
  const { tasks, error, updateTask } = useTasks();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <Alert className="max-w-md mx-4 border-rose-200 bg-rose-50">
          <AlertDescription className="text-rose-700">
            {error instanceof Error ? error.message : 'Failed to load your activities. Please try again.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50" style={{ width: '100%' }}>
        <div className="w-full px-6 py-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">My Learning Dashboard</h1>
            <p className="text-blue-600">Track your progress and update your task status</p>
          </div>
          
          <Alert className="bg-blue-50 border-blue-200">
            <ClipboardList className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-700">
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
    createdAt: task.created_at,
    // Include teacher feedback fields
    teacher_feedback_type: task.teacher_feedback_type,
    teacher_feedback_message: task.teacher_feedback_message,
    teacher_next_steps: task.teacher_next_steps,
    feedback_given_at: task.feedback_given_at,
    feedback_given_by: task.feedback_given_by
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

  // Create optimistic update function that matches TaskCard interface
  const handleUpdateTaskStatus = async (taskId: string, newStatus: TaskStatus): Promise<boolean> => {
    try {
      updateTask({ taskId, updates: { status: newStatus } });
      return true; // Optimistic update always returns true immediately
    } catch (error) {
      console.error('Error updating task status:', error);
      return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50" style={{ width: '100%' }}>
      <div className="w-full px-6 py-6 space-y-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">My Learning Dashboard</h1>
          <p className="text-blue-600">Track your progress and update your task status</p>
        </div>

        <SummaryHeader 
          tasks={convertedTasks} 
          onStatusFilter={handleStatusFilterChange}
          activeFilter={statusFilter}
        />

        {/* Filter Status Bar */}
        {statusFilter !== 'all' && (
          <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 shadow-sm">
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

        <Card className="w-full bg-white/80 backdrop-blur-sm shadow-lg border-blue-100 overflow-hidden">
          <CardContent className="p-6">
            {subjectsWithTasks.length > 0 ? (
              <ScrollArea className="w-full">
                <div className="min-w-fit">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {subjectsWithTasks.map(subject => (
                          <TableHead key={subject} className="text-center font-semibold text-blue-900 bg-gradient-to-r from-blue-50 to-indigo-50 min-w-[280px]">
                            {subject}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        {subjectsWithTasks.map(subject => (
                          <TableCell key={subject} className="align-top p-4 min-w-[280px]">
                            <div className="space-y-3">
                              {tasksBySubject[subject].map(task => (
                                <TaskCard
                                  key={task.id}
                                  task={task}
                                  onUpdateStatus={handleUpdateTaskStatus}
                                />
                              ))}
                            </div>
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            ) : statusFilter !== 'all' ? (
              <div className="text-center py-8">
                <ClipboardList className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-blue-900 mb-2">
                  No {getFilterDisplayText().toLowerCase()} tasks found
                </h3>
                <p className="text-blue-600 mb-4">
                  You don't have any tasks with "{getFilterDisplayText().toLowerCase()}" status right now.
                </p>
                <Button onClick={clearFilter} variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50">
                  <FilterX className="w-4 h-4 mr-2" />
                  Show All Tasks
                </Button>
              </div>
            ) : (
              <Alert className="bg-blue-50 border-blue-200">
                <ClipboardList className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-700">
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
