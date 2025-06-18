
import React, { useState, useEffect } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClipboardList, Loader2, Edit, Trash2, UserPlus, RefreshCw } from 'lucide-react';
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
import type { Task } from '@/hooks/useTasks';

export const TasksList = () => {
  const { tasks, loading, refetch } = useTasks();
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [assigningTask, setAssigningTask] = useState<Task | null>(null);
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
      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-blue-700 flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Learning Activities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <span className="ml-2">Loading activities...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (tasks.length === 0) {
    console.log('TasksList: Rendering empty state');
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl text-blue-700 flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Learning Activities
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="sr-only">Refresh activities</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Alert>
            <ClipboardList className="h-4 w-4" />
            <AlertDescription>
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
      working: { label: 'Working', className: 'bg-blue-100 text-blue-800' },
      'need-help': { label: 'Need Help', className: 'bg-red-100 text-red-800' },
      'ready-review': { label: 'Ready Review', className: 'bg-yellow-100 text-yellow-800' },
      completed: { label: 'Completed', className: 'bg-green-100 text-green-800' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, className: 'bg-gray-100 text-gray-800' };
    
    return (
      <Badge variant="secondary" className={`text-xs ${config.className}`}>
        {config.label}
      </Badge>
    );
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl text-blue-700 flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Learning Activities ({tasks.length})
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="sr-only">Refresh activities</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Activity Name</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => {
                  console.log('Rendering task row:', task.id, task.title);
                  return (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-medium text-sm">{task.title}</div>
                          {task.description && (
                            <div className="text-xs text-gray-500 truncate max-w-xs" title={task.description}>
                              {task.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {task.students?.name || 'Unassigned'}
                          {task.students?.email && (
                            <div className="text-xs text-gray-500">{task.students.email}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{task.subjects?.name || 'No Subject'}</span>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(task.status)}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-500">
                          {new Date(task.created_at).toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingTask(task)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit task</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setAssigningTask(task)}
                            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <UserPlus className="h-4 w-4" />
                            <span className="sr-only">Assign to student</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              console.log('Setting task for deletion:', task.id, task.title);
                              setDeletingTask(task);
                            }}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
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
