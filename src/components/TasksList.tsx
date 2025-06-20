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
import { EditTaskDialog } from '@/components/EditTaskDialog';
import { DeleteTaskDialog } from '@/components/DeleteTaskDialog';
import { AssignTaskDialog } from '@/components/AssignTaskDialog';
import { BulkAssignTaskDialog } from '@/components/BulkAssignTaskDialog';
import TableSkeleton from '@/components/TableSkeleton';
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
  
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [assigningTask, setAssigningTask] = useState<Task | null>(null);
  const [bulkAssigningTask, setBulkAssigningTask] = useState<Task | null>(null);
  const [showFilters, setShowFilters] = useState(false);

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
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl text-blue-700 flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Learning Activities ({filteredTasks.length}{tasks.length !== filteredTasks.length ? ` of ${tasks.length}` : ''})
            </CardTitle>
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <FilterX className="w-4 h-4" />
                  Clear Filters
                </Button>
              )}
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Filters
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Filters Section */}
        {showFilters && (
          <CardContent className="border-t bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 py-4">
              {/* Search */}
              <div className="space-y-2">
                <Label htmlFor="search">Search Tasks</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="search"
                    placeholder="Search by task, student, or subject..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Subject Filter */}
              <div className="space-y-2">
                <Label>Subject</Label>
                <Select value={filters.subject} onValueChange={(value) => setFilters(prev => ({ ...prev, subject: value }))}>
                  <SelectTrigger>
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
                <Label>Status</Label>
                <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
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
                <Label>Student</Label>
                <Select value={filters.student} onValueChange={(value) => setFilters(prev => ({ ...prev, student: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Students</SelectItem>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
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
                <Label>Created From</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <Calendar className="mr-2 h-4 w-4" />
                      {filters.dateFrom ? format(filters.dateFrom, "MMM dd, yyyy") : "Select date"}
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
                <Label>Created To</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <Calendar className="mr-2 h-4 w-4" />
                      {filters.dateTo ? format(filters.dateTo, "MMM dd, yyyy") : "Select date"}
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
                <Label>Group By</Label>
                <Select value={filters.groupBy} onValueChange={(value: TaskFilters['groupBy']) => setFilters(prev => ({ ...prev, groupBy: value }))}>
                  <SelectTrigger>
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
                  className="w-full flex items-center gap-2"
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
            <Alert>
              <ClipboardList className="h-4 w-4" />
              <AlertDescription>
                {tasks.length === 0 
                  ? "No learning activities found. Create your first activity using the form above."
                  : "No activities match the current filters. Try adjusting your search criteria."
                }
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedTasks).map(([groupName, groupTasks]) => (
                <div key={groupName}>
                  {filters.groupBy !== 'none' && (
                    <div className="flex items-center gap-2 mb-4 pb-2 border-b">
                      <BookOpen className="w-5 h-5 text-blue-600" />
                      <h3 className="text-lg font-semibold text-gray-900">{groupName}</h3>
                      <Badge variant="outline" className="ml-2">
                        {groupTasks.length} task{groupTasks.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  )}
                  
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[25%] min-w-[150px]">Activity Name</TableHead>
                          <TableHead className="w-[20%] min-w-[120px]">Student</TableHead>
                          <TableHead className="w-[15%] min-w-[100px]">Subject</TableHead>
                          <TableHead className="w-[12%] min-w-[90px]">Status</TableHead>
                          <TableHead className="w-[10%] min-w-[80px]">Created</TableHead>
                          <TableHead className="w-[18%] min-w-[120px] text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {groupTasks.map((task) => (
                          <TableRow 
                            key={task.id} 
                            className={isDeleting ? 'opacity-50 transition-opacity' : ''}
                          >
                            <TableCell className="font-medium w-[25%]">
                              <div className="max-w-[150px]">
                                <div className="font-medium text-sm truncate" title={task.title}>
                                  {task.title}
                                </div>
                                {task.description && (
                                  <div className="text-xs text-gray-500 truncate" title={task.description}>
                                    {task.description}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="w-[20%]">
                              <div className="text-sm max-w-[120px]">
                                <div className="truncate" title={getStudentName(task.student_id)}>
                                  {getStudentName(task.student_id)}
                                </div>
                                {task.students?.email && (
                                  <div className="text-xs text-gray-500 truncate" title={task.students.email}>
                                    {task.students.email}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="w-[15%]">
                              <span className="text-sm truncate max-w-[100px] block" title={getSubjectName(task.subject_id)}>
                                {getSubjectName(task.subject_id)}
                              </span>
                            </TableCell>
                            <TableCell className="w-[12%]">
                              {getStatusBadge(task.status)}
                            </TableCell>
                            <TableCell className="w-[10%]">
                              <span className="text-xs text-gray-500">
                                {new Date(task.created_at).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}
                              </span>
                            </TableCell>
                            <TableCell className="text-right w-[18%]">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditingTask(task)}
                                  className="h-7 w-7 p-0"
                                  disabled={isDeleting}
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
                                >
                                  <UserPlus className="h-3 w-3" />
                                  <span className="sr-only">Assign to student</span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setBulkAssigningTask(task)}
                                  className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
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
                                  className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  disabled={isDeleting}
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
    </>
  );
};
