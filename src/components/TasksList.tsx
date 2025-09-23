import React, { useState, useEffect, useMemo } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { useStudents } from '@/hooks/useStudents';
import { useSubjects } from '@/hooks/useSubjects';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClipboardList, Edit, Trash2, UserPlus, Users, Search, Filter, FilterX, Calendar, RotateCcw, BookOpen } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { EditTaskDialog } from '@/components/EditTaskDialog';
import { DeleteTaskDialog } from '@/components/DeleteTaskDialog';
import { AssignTaskDialog } from '@/components/AssignTaskDialog';
import { BulkAssignTaskDialog } from '@/components/BulkAssignTaskDialog';
import TableSkeleton from '@/components/TableSkeleton';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Task } from '@/types/task';

interface TaskFilters {
  search: string;
  subject: string;
  status: string;
  student: string;
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  groupBy: 'none' | 'task' | 'subject' | 'student';
}

export const TasksList = () => {
  const { tasks, loading, isDeleting } = useTasks();
  const { students } = useStudents();
  const { subjects } = useSubjects();
  const { toast } = useToast();
  
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [assigningTask, setAssigningTask] = useState<Task | null>(null);
  const [bulkAssigningTask, setBulkAssigningTask] = useState<Task | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Bulk selection state
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  // Filter state
  const [filters, setFilters] = useState<TaskFilters>({
    search: '',
    subject: 'all',
    status: 'all',
    student: 'all',
    dateFrom: undefined,
    dateTo: undefined,
    groupBy: 'none'
  });

  // Helper functions to get names by IDs
  const getStudentName = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    return student?.name || 'Unassigned';
  };

  const getSubjectName = (subjectId: string) => {
    const subject = subjects.find(s => s.id === subjectId);
    return subject?.name || 'No Subject';
  };

  // Filter tasks based on current filters
  const filteredTasks = useMemo(() => {
    let filtered = tasks;

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(searchLower) ||
        (task.description && task.description.toLowerCase().includes(searchLower)) ||
        getStudentName(task.student_id).toLowerCase().includes(searchLower) ||
        getSubjectName(task.subject_id).toLowerCase().includes(searchLower)
      );
    }

    // Subject filter
    if (filters.subject !== 'all') {
      filtered = filtered.filter(task => task.subject_id === filters.subject);
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(task => task.status === filters.status);
    }

    // Student filter
    if (filters.student !== 'all') {
      filtered = filtered.filter(task => task.student_id === filters.student);
    }

    // Date range filter
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(task => new Date(task.created_at) >= fromDate);
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(task => new Date(task.created_at) <= toDate);
    }

    return filtered;
  }, [tasks, filters, students, subjects]);

  // Group tasks if groupBy is selected
  const groupedTasks = useMemo(() => {
    if (filters.groupBy === 'none') {
      return { 'All Tasks': filteredTasks };
    }

    const groups: Record<string, Task[]> = {};

    filteredTasks.forEach(task => {
      let groupKey: string;
      
      switch (filters.groupBy) {
        case 'task':
          groupKey = task.title;
          break;
        case 'subject':
          groupKey = getSubjectName(task.subject_id);
          break;
        case 'student':
          groupKey = getStudentName(task.student_id);
          break;
        default:
          groupKey = 'All Tasks';
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(task);
    });

    return groups;
  }, [filteredTasks, filters.groupBy, students, subjects]);

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      search: '',
      subject: 'all',
      status: 'all',
      student: 'all',
      dateFrom: undefined,
      dateTo: undefined,
      groupBy: 'none'
    });
  };

  // Check if any filters are active
  const hasActiveFilters = filters.search || 
    filters.subject !== 'all' || 
    filters.status !== 'all' || 
    filters.student !== 'all' || 
    filters.dateFrom || 
    filters.dateTo ||
    filters.groupBy !== 'none';

  // Bulk selection handlers
  const handleSelectTask = (taskId: string, checked: boolean) => {
    const newSelected = new Set(selectedTasks);
    if (checked) {
      newSelected.add(taskId);
    } else {
      newSelected.delete(taskId);
    }
    setSelectedTasks(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allTaskIds = new Set(filteredTasks.map(task => task.id));
      setSelectedTasks(allTaskIds);
    } else {
      setSelectedTasks(new Set());
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTasks.size === 0) return;
    
    try {
      // Delete all selected tasks
      const deletePromises = Array.from(selectedTasks).map(taskId => 
        supabase.from('tasks').delete().eq('id', taskId)
      );
      
      await Promise.all(deletePromises);
      
      // Clear selection and close dialog
      setSelectedTasks(new Set());
      setShowBulkDeleteConfirm(false);
      
      toast({
        title: "Success",
        description: `${selectedTasks.size} tasks deleted successfully!`,
      });
    } catch (error) {
      console.error('Error deleting tasks:', error);
      toast({
        title: "Error",
        description: "Failed to delete some tasks. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Debug logging for development
  useEffect(() => {
    console.log('=== TASKS LIST UPDATE ===');
    console.log('Tasks count:', tasks.length);
    console.log('Filtered count:', filteredTasks.length);
    console.log('Loading:', loading);
    console.log('Active filters:', hasActiveFilters);
  }, [tasks, filteredTasks, loading, hasActiveFilters]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      todo: { label: 'TO DO', className: 'bg-gray-100 text-gray-800 border-gray-200' },
      working: { label: 'Working', className: 'bg-blue-100 text-blue-800 border-blue-200' },
      'need-help': { label: 'Need Help', className: 'bg-rose-100 text-rose-800 border-rose-200' },
      'ready-review': { label: 'Ready Review', className: 'bg-amber-100 text-amber-800 border-amber-200' },
      completed: { label: 'Completed', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, className: 'bg-gray-100 text-gray-800 border-gray-200' };
    
    return (
      <Badge variant="secondary" className={`text-xs ${config.className}`}>
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-blue-700 flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Learning Activities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TableSkeleton rows={5} columns={6} />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-blue-100">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl text-blue-700 flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-blue-600" />
              Learning Activities ({filteredTasks.length})
            </CardTitle>
            
            <div className="flex items-center gap-2">
              {selectedTasks.size > 0 && (
                <Button
                  onClick={() => setShowBulkDeleteConfirm(true)}
                  variant="destructive"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Selected ({selectedTasks.size})
                </Button>
              )}
              
              {hasActiveFilters && (
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 border-blue-200 text-blue-700 hover:bg-blue-50"
                >
                  <FilterX className="w-4 h-4" />
                  Clear
                </Button>
              )}
              
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                <Filter className="w-4 h-4" />
                {showFilters ? 'Hide' : 'Show'} Filters
              </Button>
            </div>
          </div>
          
          {/* Filter Summary */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mt-2">
              {filters.search && (
                <div className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  Search: "{filters.search}"
                </div>
              )}
              {filters.subject !== 'all' && (
                <div className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  Subject: {getSubjectName(filters.subject)}
                </div>
              )}
              {filters.status !== 'all' && (
                <div className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  Status: {filters.status}
                </div>
              )}
              {filters.student !== 'all' && (
                <div className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  Student: {getStudentName(filters.student)}
                </div>
              )}
              {filters.groupBy !== 'none' && (
                <div className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  Grouped by: {filters.groupBy}
                </div>
              )}
            </div>
          )}
        </CardHeader>

        {showFilters && (
          <CardContent className="border-t bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 py-4">
              {/* Search */}
              <div className="space-y-2">
                <Label htmlFor="search" className="text-blue-900">Search Tasks</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 w-4 h-4" />
                  <Input
                    id="search"
                    placeholder="Search by task, student, or subject..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="pl-10 border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Subject Filter */}
              <div className="space-y-2">
                <Label className="text-blue-900">Subject</Label>
                <Select value={filters.subject} onValueChange={(value) => setFilters(prev => ({ ...prev, subject: value }))}>
                  <SelectTrigger className="border-blue-200 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <Label className="text-blue-900">Status</Label>
                <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger className="border-blue-200 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="working">Working</SelectItem>
                    <SelectItem value="need-help">Need Help</SelectItem>
                    <SelectItem value="ready-review">Ready Review</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Student Filter */}
              <div className="space-y-2">
                <Label className="text-blue-900">Student</Label>
                <Select value={filters.student} onValueChange={(value) => setFilters(prev => ({ ...prev, student: value }))}>
                  <SelectTrigger className="border-blue-200 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Students</SelectItem>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date From */}
              <div className="space-y-2">
                <Label className="text-blue-900">Date From</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={`w-full justify-start text-left font-normal border-blue-200 text-blue-700 hover:bg-blue-50 ${
                        !filters.dateFrom && "text-blue-500"
                      }`}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {filters.dateFrom ? format(filters.dateFrom, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={filters.dateFrom}
                      onSelect={(date) => setFilters(prev => ({ ...prev, dateFrom: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Date To */}
              <div className="space-y-2">
                <Label className="text-blue-900">Date To</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={`w-full justify-start text-left font-normal border-blue-200 text-blue-700 hover:bg-blue-50 ${
                        !filters.dateTo && "text-blue-500"
                      }`}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {filters.dateTo ? format(filters.dateTo, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={filters.dateTo}
                      onSelect={(date) => setFilters(prev => ({ ...prev, dateTo: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Group By */}
              <div className="space-y-2">
                <Label className="text-blue-900">Group By</Label>
                <Select value={filters.groupBy} onValueChange={(value: TaskFilters['groupBy']) => setFilters(prev => ({ ...prev, groupBy: value }))}>
                  <SelectTrigger className="border-blue-200 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Grouping</SelectItem>
                    <SelectItem value="task">By Task Name</SelectItem>
                    <SelectItem value="subject">By Subject</SelectItem>
                    <SelectItem value="student">By Student</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Reset Button */}
              <div className="space-y-2">
                <Label>&nbsp;</Label>
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  className="w-full flex items-center gap-2 border-blue-200 text-blue-700 hover:bg-blue-50"
                  disabled={!hasActiveFilters}
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </Button>
              </div>
            </div>
          </CardContent>
        )}

        <CardContent>
          {filteredTasks.length === 0 ? (
            <div className="text-center py-8 text-blue-600">
              {hasActiveFilters 
                ? "No tasks match your current filters." 
                : "No learning activities created yet. Use the form above to create your first activity."
              }
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedTasks).map(([groupName, groupTasks]) => (
                <div key={groupName}>
                  {/* Group Header */}
                  {filters.groupBy !== 'none' && (
                    <div className="mb-4">
                      <h4 className="text-lg font-semibold text-blue-900 flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-blue-600" />
                        {groupName} ({groupTasks.length})
                      </h4>
                    </div>
                  )}
                  
                  <div className="rounded-lg border border-blue-200 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gradient-to-r from-blue-50 to-indigo-50">
                          <TableHead className="w-[5%] min-w-[50px] text-blue-900 font-semibold">
                            <Checkbox
                              checked={selectedTasks.size === groupTasks.length && groupTasks.length > 0}
                              onCheckedChange={(checked) => handleSelectAll(checked === true)}
                            />
                          </TableHead>
                          <TableHead className="w-[23%] min-w-[150px] text-blue-900 font-semibold">Activity Name</TableHead>
                          <TableHead className="w-[18%] min-w-[120px] text-blue-900 font-semibold">Student</TableHead>
                          <TableHead className="w-[14%] min-w-[100px] text-blue-900 font-semibold">Subject</TableHead>
                          <TableHead className="w-[11%] min-w-[90px] text-blue-900 font-semibold">Status</TableHead>
                          <TableHead className="w-[9%] min-w-[80px] text-blue-900 font-semibold">Created</TableHead>
                          <TableHead className="w-[20%] min-w-[120px] text-right text-blue-900 font-semibold">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="divide-y divide-blue-100">
                        {groupTasks.map((task) => (
                          <TableRow 
                            key={task.id} 
                            className={`hover:bg-blue-50/50 transition-colors ${isDeleting ? 'opacity-50 transition-opacity' : ''}`}
                          >
                            <TableCell className="w-[5%]">
                              <Checkbox
                                checked={selectedTasks.has(task.id)}
                                onCheckedChange={(checked) => handleSelectTask(task.id, checked === true)}
                              />
                            </TableCell>
                            <TableCell className="font-medium w-[23%]">
                              <div className="max-w-[150px]">
                                <div className="font-medium text-sm truncate text-blue-900" title={task.title}>
                                  {task.title}
                                </div>
                                {task.description && (
                                  <div className="text-xs text-blue-600 truncate" title={task.description}>
                                    {task.description}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="w-[18%]">
                              <div className="text-sm max-w-[120px]">
                                <div className="truncate text-gray-900" title={getStudentName(task.student_id)}>
                                  {getStudentName(task.student_id)}
                                </div>
                                {task.students?.email && (
                                  <div className="text-xs text-gray-500 truncate" title={task.students.email}>
                                    {task.students.email}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="w-[14%]">
                              <span className="text-sm truncate max-w-[100px] block" title={getSubjectName(task.subject_id)}>
                                {getSubjectName(task.subject_id)}
                              </span>
                            </TableCell>
                            <TableCell className="w-[11%]">
                              {getStatusBadge(task.status)}
                            </TableCell>
                            <TableCell className="w-[9%]">
                              <span className="text-xs text-gray-500">
                                {new Date(task.created_at).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}
                              </span>
                            </TableCell>
                            <TableCell className="text-right w-[20%]">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditingTask(task)}
                                  className="h-7 w-7 p-0 text-gray-600 hover:text-gray-800 hover:bg-blue-50"
                                  disabled={isDeleting}
                                  title="Edit task"
                                >
                                  <Edit className="h-3 w-3" />
                                  <span className="sr-only">Edit task</span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setAssigningTask(task)}
                                  className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                  disabled={isDeleting}
                                  title="Assign to student"
                                >
                                  <UserPlus className="h-3 w-3" />
                                  <span className="sr-only">Assign to student</span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setBulkAssigningTask(task)}
                                  className="h-7 w-7 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                  title="Assign to multiple students"
                                  disabled={isDeleting}
                                >
                                  <Users className="h-3 w-3" />
                                  <span className="sr-only">Assign to multiple students</span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDeletingTask(task)}
                                  className="h-7 w-7 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                  disabled={isDeleting}
                                  title="Delete task"
                                >
                                  <Trash2 className="h-3 w-3" />
                                  <span className="sr-only">Delete task</span>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      {editingTask && (
        <EditTaskDialog
          task={editingTask}
          open={!!editingTask}
          onOpenChange={(open) => !open && setEditingTask(null)}
        />
      )}

      {deletingTask && (
        <DeleteTaskDialog
          task={deletingTask}
          open={!!deletingTask}
          onOpenChange={(open) => !open && setDeletingTask(null)}
        />
      )}

      {assigningTask && (
        <AssignTaskDialog
          task={assigningTask}
          open={!!assigningTask}
          onOpenChange={(open) => !open && setAssigningTask(null)}
        />
      )}

      {bulkAssigningTask && (
        <BulkAssignTaskDialog
          task={bulkAssigningTask}
          open={!!bulkAssigningTask}
          onOpenChange={(open) => !open && setBulkAssigningTask(null)}
        />
      )}

      {/* Bulk Delete Confirmation Dialog */}
      {showBulkDeleteConfirm && (
        <AlertDialog open={showBulkDeleteConfirm} onOpenChange={setShowBulkDeleteConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Selected Tasks</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete {selectedTasks.size} selected task{selectedTasks.size !== 1 ? 's' : ''}? 
                This action cannot be undone and will permanently remove the task{selectedTasks.size !== 1 ? 's' : ''} 
                from all assigned students.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleBulkDelete}
                className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              >
                Delete {selectedTasks.size} Task{selectedTasks.size !== 1 ? 's' : ''}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
};
