
import React, { useState, useEffect } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClipboardList, Loader2, Edit, Trash2, UserPlus, RefreshCw, Users } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { EditTaskDialog } from '@/components/EditTaskDialog';
import { DeleteTaskDialog } from '@/components/DeleteTaskDialog';
import { AssignTaskDialog } from '@/components/AssignTaskDialog';
import { BulkAssignTaskDialog } from '@/components/BulkAssignTaskDialog';
import type { Task } from '@/types/task';

export const TasksList = () => {
  const { tasks, loading, refetch } = useTasks();
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [assigningTask, setAssigningTask] = useState<Task | null>(null);
  const [bulkAssigningTask, setBulkAssigningTask] = useState<Task | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Add debugging to track when tasks change
  useEffect(() => {
    console.log('=== TASKS LIST UPDATE ===');
    console.log('Tasks count:', tasks.length);
    console.log('Loading:', loading);
    console.log('Tasks data:', tasks);
  }, [tasks, loading]);

  const handleManualRefresh = async () => {
    console.log('=== MANUAL REFRESH TRIGGERED ===');
    setIsRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.error('Error during manual refresh:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (loading) {
    console.log('TasksList: Rendering loading state');
    return (
      <Card className="shadow-lg border-2">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
          <CardTitle className="text-xl text-blue-700 flex items-center gap-2">
            <ClipboardList className="h-6 w-6" />
            Learning Activities
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-3 text-lg font-medium">Loading activities...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (tasks.length === 0) {
    console.log('TasksList: Rendering empty state');
    return (
      <Card className="shadow-lg border-2">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl text-blue-700 flex items-center gap-2">
              <ClipboardList className="h-6 w-6" />
              Learning Activities
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="h-10 w-10 p-0 hover:bg-white/80"
            >
              <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="sr-only">Refresh activities</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <Alert className="border-blue-200 bg-blue-50">
            <ClipboardList className="h-5 w-5 text-blue-600" />
            <AlertDescription className="text-blue-800 font-medium">
              No learning activities found. Create your first activity using the form above.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  console.log('TasksList: Rendering table with', tasks.length, 'tasks');

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      working: { label: 'Working', className: 'bg-blue-500 text-white hover:bg-blue-600' },
      'need-help': { label: 'Need Help', className: 'bg-red-500 text-white hover:bg-red-600' },
      'ready-review': { label: 'Ready Review', className: 'bg-yellow-500 text-white hover:bg-yellow-600' },
      completed: { label: 'Completed', className: 'bg-green-500 text-white hover:bg-green-600' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, className: 'bg-gray-500 text-white' };
    
    return (
      <Badge className={`font-medium px-3 py-1 ${config.className}`}>
        {config.label}
      </Badge>
    );
  };

  return (
    <>
      <Card className="shadow-lg border-2 border-gray-200">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-100">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl text-blue-700 flex items-center gap-3 font-bold">
              <ClipboardList className="h-7 w-7" />
              Learning Activities ({tasks.length})
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="h-10 w-10 p-0 hover:bg-white/80 border border-blue-200"
            >
              <RefreshCw className={`h-5 w-5 text-blue-600 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="sr-only">Refresh activities</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50 border-b-2">
                  <TableHead className="font-bold text-gray-700 text-base py-4 px-6">Activity Name</TableHead>
                  <TableHead className="font-bold text-gray-700 text-base py-4 px-6">Student</TableHead>
                  <TableHead className="font-bold text-gray-700 text-base py-4 px-6">Subject</TableHead>
                  <TableHead className="font-bold text-gray-700 text-base py-4 px-6">Status</TableHead>
                  <TableHead className="font-bold text-gray-700 text-base py-4 px-6">Created</TableHead>
                  <TableHead className="text-right font-bold text-gray-700 text-base py-4 px-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task, index) => {
                  console.log('Rendering task row:', task.id, task.title);
                  return (
                    <TableRow 
                      key={task.id} 
                      className={`hover:bg-blue-50 transition-colors border-b ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                      }`}
                    >
                      <TableCell className="font-medium py-4 px-6">
                        <div>
                          <div className="font-semibold text-gray-900 text-base mb-1">{task.title}</div>
                          {task.description && (
                            <div className="text-sm text-gray-600 line-clamp-2 max-w-xs" title={task.description}>
                              {task.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        <div className="text-base">
                          <div className="font-medium text-gray-900">
                            {task.students?.name || 'Unassigned'}
                          </div>
                          {task.students?.email && (
                            <div className="text-sm text-gray-500">{task.students.email}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        <span className="text-base font-medium text-gray-800 bg-gray-100 px-3 py-1 rounded-full">
                          {task.subjects?.name || 'No Subject'}
                        </span>
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        {getStatusBadge(task.status)}
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        <span className="text-base text-gray-600 font-medium">
                          {new Date(task.created_at).toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-right py-4 px-6">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingTask(task)}
                            className="h-9 w-9 p-0 hover:bg-blue-100 text-blue-600"
                            title="Edit task"
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit task</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setAssigningTask(task)}
                            className="h-9 w-9 p-0 text-green-600 hover:bg-green-100"
                            title="Assign to student"
                          >
                            <UserPlus className="h-4 w-4" />
                            <span className="sr-only">Assign to student</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setBulkAssigningTask(task)}
                            className="h-9 w-9 p-0 text-purple-600 hover:bg-purple-100"
                            title="Assign to multiple students"
                          >
                            <Users className="h-4 w-4" />
                            <span className="sr-only">Assign to multiple students</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              console.log('Setting task for deletion:', task.id, task.title);
                              setDeletingTask(task);
                            }}
                            className="h-9 w-9 p-0 text-red-600 hover:bg-red-100"
                            title="Delete task"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete task</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <EditTaskDialog
        task={editingTask}
        open={!!editingTask}
        onOpenChange={(open) => !open && setEditingTask(null)}
      />

      <AssignTaskDialog
        task={assigningTask}
        open={!!assigningTask}
        onOpenChange={(open) => !open && setAssigningTask(null)}
      />

      <BulkAssignTaskDialog
        task={bulkAssigningTask}
        open={!!bulkAssigningTask}
        onOpenChange={(open) => !open && setBulkAssigningTask(null)}
      />

      <DeleteTaskDialog
        task={deletingTask}
        open={!!deletingTask}
        onOpenChange={(open) => {
          console.log('DeleteTaskDialog onOpenChange:', open);
          if (!open) {
            console.log('Clearing deleting task');
            setDeletingTask(null);
          }
        }}
      />
    </>
  );
};
