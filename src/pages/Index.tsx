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
import { Card, CardContent } from '@/components/ui/card';
import { TaskStatus } from '@/types/task';
import { Button } from '@/components/ui/button';
import { FilterX, Users, UserCheck } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type StatusFilter = TaskStatus | 'all';
type AttendanceFilter = 'all' | 'present' | 'absent';

const Index = () => {
  const { user } = useAuth();
  const { isAdmin, isTeacher, isStudent } = useUserRole();
  const { students } = useStudents();
  const { subjects } = useSubjects();
  const { tasks, updateTaskStatus } = useTasks();
  const { attendance: attendanceRecords } = useAttendance();

  // Filter states
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [attendanceFilter, setAttendanceFilter] = useState<AttendanceFilter>('all');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

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
      createdAt: task.created_at
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
    const success = await updateTaskStatus(taskId, newStatus);
    if (success) {
      console.log(`Index: Task ${taskId} status updated to ${newStatus}`);
      return true;
    } else {
      console.error(`Index: Failed to update task ${taskId} status to ${newStatus}`);
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Student Progress Overview</h1>
      </div>
      
      <SummaryHeader 
        tasks={transformedTasks} 
        onStatusFilter={handleStatusFilterChange}
        activeFilter={statusFilter}
      />

      {/* Additional Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Attendance:</span>
            <Select value={attendanceFilter} onValueChange={(value: AttendanceFilter) => setAttendanceFilter(value)}>
              <SelectTrigger className="w-32">
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
            <Users className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Students:</span>
            <Select>
              <SelectTrigger className="w-48">
                <SelectValue placeholder={
                  selectedStudentIds.length === 0 
                    ? "All students" 
                    : `${selectedStudentIds.length} selected`
                } />
              </SelectTrigger>
              <SelectContent>
                <div className="p-2">
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {transformedStudents.map(student => (
                      <div key={student.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`student-${student.id}`}
                          checked={selectedStudentIds.includes(student.id)}
                          onChange={() => handleStudentToggle(student.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label 
                          htmlFor={`student-${student.id}`}
                          className="text-sm text-gray-700 cursor-pointer"
                        >
                          {student.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </SelectContent>
            </Select>
          </div>

          {hasActiveFilters && (
            <Button
              onClick={clearAllFilters}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <FilterX className="w-4 h-4" />
              Clear All Filters
            </Button>
          )}
        </div>
      </div>

      {/* Filter Status Bar */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-4">
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
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
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
