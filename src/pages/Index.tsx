import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useStudents } from '@/hooks/useStudents';
import { useSubjects } from '@/hooks/useSubjects';
import { useTasks } from '@/hooks/useTasks';
import { useAttendance } from '@/hooks/useAttendance';
import FleetBoard from '../components/FleetBoard';
import SummaryHeader from '../components/SummaryHeader';
import StudentDashboard from '../components/StudentDashboard';
import HelpTooltip from '../components/HelpTooltip';
import { Card, CardContent } from '@/components/ui/card';
import { TaskStatus } from '@/types/task';
import { Button } from '@/components/ui/button';
import { FilterX, Users, UserCheck, RefreshCw, ChevronDown, Check } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';

type StatusFilter = TaskStatus | 'all';
type AttendanceFilter = 'all' | 'present' | 'absent';

const Index = () => {
  const { user } = useAuth();
  const { isAdmin, isTeacher, isStudent } = useUserRole();
  const { students, refetch: refetchStudents } = useStudents();
  const { subjects, refetch: refetchSubjects } = useSubjects();
  const { tasks, updateTask, refetch: refetchTasks, isRefetching } = useTasks();
  const { attendance: attendanceRecords, refetch: refetchAttendance } = useAttendance();
  const { toast } = useToast();

  // Filter states
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [attendanceFilter, setAttendanceFilter] = useState<AttendanceFilter>('all');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const [isStudentDropdownOpen, setIsStudentDropdownOpen] = useState(false);

  // Add debugging for subjects data
  React.useEffect(() => {
    console.log('Index: User roles:', { isAdmin, isTeacher, isStudent });
    console.log('Index: Subjects data:', subjects);
    console.log('Index: Tasks data length:', tasks.length);
    console.log('Index: Attendance records:', attendanceRecords);
    console.log('Index: Attendance records count:', attendanceRecords.length);
    
    // Debug today's attendance
    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = attendanceRecords.filter(record => record.date === today);
    console.log('Index: Today\'s attendance records:', todayAttendance);
    console.log('Index: Today\'s attendance count:', todayAttendance.length);
  }, [isAdmin, isTeacher, isStudent, subjects, tasks, attendanceRecords]);

  if (!user) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <p>Please sign in to access the student tracker.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if the current user exists in the students table
  const currentUserAsStudent = students.find(student => student.id === user.id);
  
  // Show student dashboard if:
  // 1. User has student role, OR
  // 2. User exists in the students table (even if they're admin/teacher)
  if (isStudent || currentUserAsStudent) {
    console.log('Index: Showing student dashboard for user:', user.id);
    console.log('Index: User is student:', isStudent);
    console.log('Index: User exists in students table:', !!currentUserAsStudent);
    return <StudentDashboard />;
  }

  // Show fleet board for teachers and admins who are not students
  if (!isAdmin && !isTeacher) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <p>You don't have permission to access the student tracker. Please contact an administrator to assign you the appropriate role.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Transform data to match the existing component interfaces
  const transformedStudents = students.map(student => ({
    id: student.id,
    name: student.name,
    grade: parseInt(student.grade)
  }));

  const subjectNames = subjects.map(subject => subject.name);

  const transformedTasks = tasks.map(task => {
    console.log('Index: Raw task data:', task);
    
    let subjectName = '';
    
    if (task.subjects?.name) {
      subjectName = task.subjects.name;
    } else {
      const subject = subjects.find(s => s.id === task.subject_id);
      subjectName = subject?.name || '';
    }
    
    console.log('Index: Final subject name for task:', subjectName);
    
    return {
      id: task.id,
      title: task.title,
      description: task.description || '',
      studentId: task.student_id,
      subject: subjectName,
      status: task.status,
      timeInStatus: task.time_in_status || 0,
      createdAt: task.created_at,
      teacher_feedback_type: task.teacher_feedback_type,
      teacher_feedback_message: task.teacher_feedback_message,
      teacher_next_steps: task.teacher_next_steps,
      feedback_given_at: task.feedback_given_at,
      feedback_given_by: task.feedback_given_by
    };
  });

  console.log('Index: Final transformed tasks:', transformedTasks);

  // Helper function to check if student is present today
  const isStudentPresent = (studentId: string) => {
    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = attendanceRecords.find(
      record => record.student_id === studentId && record.date === today
    );
    return todayAttendance?.is_present === true;
  };

  // Apply all filters to get the final filtered students
  const getFilteredStudents = () => {
    let filtered = transformedStudents;

    // Filter by task status
    if (statusFilter !== 'all') {
      const studentsWithFilteredTasks = transformedTasks
        .filter(task => task.status === statusFilter)
        .map(task => task.studentId);
      const uniqueStudentIds = [...new Set(studentsWithFilteredTasks)];
      filtered = filtered.filter(student => uniqueStudentIds.includes(student.id));
    }

    // Filter by attendance
    if (attendanceFilter !== 'all') {
      filtered = filtered.filter(student => {
        const isPresent = isStudentPresent(student.id);
        return attendanceFilter === 'present' ? isPresent : !isPresent;
      });
    }

    // Filter by selected students
    if (selectedStudentIds.length > 0) {
      filtered = filtered.filter(student => selectedStudentIds.includes(student.id));
    }

    return filtered;
  };

  // Filter subjects based on status filter - only show subjects that have tasks in the selected status
  const getFilteredSubjects = () => {
    if (statusFilter === 'all') {
      return subjectNames;
    }

    // Get subjects that have tasks with the selected status from filtered students
    const filteredStudentIds = getFilteredStudents().map(s => s.id);
    const subjectsWithFilteredTasks = transformedTasks
      .filter(task => task.status === statusFilter && filteredStudentIds.includes(task.studentId))
      .map(task => task.subject)
      .filter(subject => subject); // Remove empty subjects

    // Remove duplicates and return filtered subjects
    const uniqueSubjects = [...new Set(subjectsWithFilteredTasks)];
    return subjectNames.filter(subject => uniqueSubjects.includes(subject));
  };

  const getTasksForStudent = (studentId: string) => {
    return transformedTasks.filter(task => task.studentId === studentId);
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: TaskStatus): Promise<boolean> => {
    console.log(`Index: Attempting to update task ${taskId} to status ${newStatus}`);
    try {
      updateTask({ taskId, updates: { status: newStatus } });
      console.log(`Index: Task ${taskId} status update initiated (optimistic)`);
      return true; // Optimistic update always returns true immediately
    } catch (error) {
      console.error(`Index: Failed to update task ${taskId} status to ${newStatus}:`, error);
      return false;
    }
  };

  // Handle status filter change from summary tiles
  const handleStatusFilterChange = (status: StatusFilter) => {
    console.log('Filter changed to:', status);
    setStatusFilter(status);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setStatusFilter('all');
    setAttendanceFilter('all');
    setSelectedStudentIds([]);
  };

  // Handle student multi-select
  const handleStudentToggle = (studentId: string) => {
    setSelectedStudentIds(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const filteredStudents = getFilteredStudents();
  const filteredSubjects = getFilteredSubjects();

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

  // Count how many students have tasks in the filtered status
  const getFilteredTasksCount = () => {
    if (statusFilter === 'all') return transformedTasks.length;
    return transformedTasks.filter(task => task.status === statusFilter).length;
  };

  // Check if any filters are active
  const hasActiveFilters = statusFilter !== 'all' || attendanceFilter !== 'all' || selectedStudentIds.length > 0;

  // Manual refresh function for TV display
  const handleManualRefresh = async () => {
    console.log('=== MANUAL REFRESH TRIGGERED ===');
    setIsManualRefreshing(true);
    
    try {
      // Refresh all data in parallel
      await Promise.all([
        refetchTasks(),
        refetchStudents(),
        refetchSubjects(),
        refetchAttendance()
      ]);
      
      console.log('=== MANUAL REFRESH COMPLETED ===');
      toast({
        title: "Data Refreshed",
        description: "All data has been synchronized successfully!",
        duration: 2000,
      });
    } catch (error) {
      console.error('Manual refresh failed:', error);
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh data. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsManualRefreshing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
            Student Progress Overview
          </h1>
          <HelpTooltip
            title="Dashboard Overview"
            content={[
              "This dashboard shows all students and their real-time task progress.",
              "Students appear as cards organized by subject columns.",
              "Task colors indicate status: Blue (Working), Red (Need Help), Orange (Ready Review), Green (Completed).",
              "Click progress tiles above to filter by status, or use additional filters below."
            ]}
          />
        </div>
        <div className="flex items-center gap-3">
          <HelpTooltip
            title="Refresh Data"
            content={[
              "Click to manually refresh all data from the server.",
              "Useful for TV displays or when real-time updates seem delayed.",
              "Data automatically updates in real-time, but manual refresh ensures latest information."
            ]}
            size="sm"
          />
          <Button
            onClick={handleManualRefresh}
            disabled={isManualRefreshing || isRefetching}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 border-blue-300 text-blue-700 hover:bg-blue-100 disabled:opacity-50"
          >
            <RefreshCw 
              className={`w-4 h-4 ${isManualRefreshing || isRefetching ? 'animate-spin' : ''}`} 
            />
            {isManualRefreshing || isRefetching ? 'Refreshing...' : 'Refresh Data'}
          </Button>
        </div>
      </div>
      
      <SummaryHeader 
        tasks={transformedTasks} 
        onStatusFilter={handleStatusFilterChange}
        activeFilter={statusFilter}
      />

      {/* Additional Filters */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-blue-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-sm font-semibold text-blue-900">Additional Filters</h3>
          <HelpTooltip
            title="Advanced Filtering"
            content={[
              "Use these filters to narrow down your view of students.",
              "Attendance filter shows only present or absent students for today.",
              "Student selector lets you focus on specific students.",
              "All filters work together - combine them for precise classroom views."
            ]}
            size="sm"
          />
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Attendance:</span>
            <Select value={attendanceFilter} onValueChange={(value: AttendanceFilter) => setAttendanceFilter(value)}>
              <SelectTrigger className="w-32 border-blue-200 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Students:</span>
            <Popover open={isStudentDropdownOpen} onOpenChange={setIsStudentDropdownOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-48 justify-between border-blue-200 focus:border-blue-500 focus:ring-blue-500 hover:bg-blue-50"
                >
                  {selectedStudentIds.length === 0 ? (
                    "All Students"
                  ) : selectedStudentIds.length === 1 ? (
                    students.find(s => s.id === selectedStudentIds[0])?.name || "1 Student"
                  ) : (
                    `${selectedStudentIds.length} Students`
                  )}
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-0" align="start">
                <div className="p-3 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">Select Students</span>
                    {selectedStudentIds.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs text-blue-600 hover:text-blue-700"
                        onClick={() => setSelectedStudentIds([])}
                      >
                        Clear All
                      </Button>
                    )}
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  <div className="p-2 space-y-1">
                    {students.map(student => (
                      <div
                        key={student.id}
                        className="flex items-center space-x-2 p-2 hover:bg-blue-50 rounded-md cursor-pointer"
                        onClick={() => handleStudentToggle(student.id)}
                      >
                        <Checkbox
                          checked={selectedStudentIds.includes(student.id)}
                          onCheckedChange={() => handleStudentToggle(student.id)}
                          className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                        />
                        <span className="text-sm text-gray-900 flex-1">{student.name}</span>
                        {selectedStudentIds.includes(student.id) && (
                          <Check className="h-4 w-4 text-blue-600" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-3 border-t border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>{selectedStudentIds.length} of {students.length} selected</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => {
                        if (selectedStudentIds.length === students.length) {
                          setSelectedStudentIds([]);
                        } else {
                          setSelectedStudentIds(students.map(s => s.id));
                        }
                      }}
                    >
                      {selectedStudentIds.length === students.length ? 'Deselect All' : 'Select All'}
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="ml-auto text-sm text-blue-700">
            Showing {filteredStudents.length} students across {filteredSubjects.length} subjects
          </div>
        </div>
      </div>

      {/* Filter Status Bar */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-blue-900">
              Active Filters:
            </span>
            <div className="flex gap-2 flex-wrap">
              {statusFilter !== 'all' && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  {getFilterDisplayText()}
                </span>
              )}
              {attendanceFilter !== 'all' && (
                <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs rounded-full">
                  {attendanceFilter === 'present' ? 'Present' : 'Absent'}
                </span>
              )}
              {selectedStudentIds.length > 0 && (
                <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                  {selectedStudentIds.length} Students
                </span>
              )}
            </div>
            <span className="text-sm text-blue-700">
              Showing {filteredStudents.length} students across {filteredSubjects.length} subjects
            </span>
          </div>
          <Button
            onClick={clearAllFilters}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 border-blue-300 text-blue-700 hover:bg-blue-100"
          >
            <FilterX className="w-4 h-4" />
            Clear All
          </Button>
        </div>
      )}

      <FleetBoard 
        students={filteredStudents}
        subjects={filteredSubjects}
        tasks={transformedTasks}
        onUpdateTaskStatus={handleUpdateTaskStatus}
        getTasksForStudent={getTasksForStudent}
        statusFilter={statusFilter}
      />
    </div>
  );
};

export default Index;
