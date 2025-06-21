import React, { useState, useMemo } from 'react';
import { PermissionGuard } from '@/components/PermissionGuard';
import { useAttendance } from '@/hooks/useAttendance';
import { useStudents } from '@/hooks/useStudents';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CheckCircle, XCircle, Search, Calendar as CalendarIcon, Trash2, Edit, UserCheck, Loader2, Clock, UserPlus } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface StudentAttendanceRow {
  studentId: string;
  studentName: string;
  attendanceRecord?: {
    id: string;
    date: string;
    is_present: boolean;
    marked_at: string | null;
    marked_by: string | null;
  };
  status: 'present' | 'absent' | 'not-marked';
}

const AttendanceManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'present' | 'absent' | 'not-marked'>('all');
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);

  // Pass dateFilter to useAttendance hook for server-side filtering
  const { 
    attendance, 
    loading, 
    refetch, 
    markAttendance, 
    isMarkingAttendance,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage
  } = useAttendance(dateFilter);
  
  const { students } = useStudents();
  const { toast } = useToast();

  // Create comprehensive student attendance rows
  const studentAttendanceRows = useMemo((): StudentAttendanceRow[] => {
    console.log('=== CREATING STUDENT ATTENDANCE ROWS ===');
    console.log('Students:', students.length);
    console.log('Attendance records:', attendance.length);
    console.log('Date filter:', dateFilter);

    const targetDate = dateFilter ? dateFilter.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    console.log('Target date:', targetDate);

    const rows = students.map(student => {
      // Find attendance record for this student on the target date
      const attendanceRecord = attendance.find(record => 
        record.student_id === student.id && record.date === targetDate
      );

      let status: 'present' | 'absent' | 'not-marked';
      if (attendanceRecord) {
        status = attendanceRecord.is_present ? 'present' : 'absent';
      } else {
        status = 'not-marked';
      }

      return {
        studentId: student.id,
        studentName: student.name,
        attendanceRecord: attendanceRecord ? {
          id: attendanceRecord.id,
          date: attendanceRecord.date,
          is_present: attendanceRecord.is_present,
          marked_at: attendanceRecord.marked_at,
          marked_by: attendanceRecord.marked_by
        } : undefined,
        status
      };
    });

    console.log('Generated rows:', rows.length);
    console.log('Rows with attendance:', rows.filter(r => r.attendanceRecord).length);
    console.log('Rows not marked:', rows.filter(r => r.status === 'not-marked').length);

    return rows;
  }, [students, attendance, dateFilter]);

  // Filter the student attendance rows
  const filteredRows = useMemo(() => {
    return studentAttendanceRows.filter(row => {
      // Search filter
      const matchesSearch = !searchTerm || 
        row.studentName.toLowerCase().includes(searchTerm.toLowerCase());

      // Status filter
      const matchesStatus = statusFilter === 'all' || row.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [studentAttendanceRows, searchTerm, statusFilter]);

  // Toggle attendance status
  const handleToggleAttendance = async (studentId: string, currentStatus: boolean) => {
    const success = await markAttendance(studentId, !currentStatus);
    if (success) {
      toast({
        title: "Attendance Updated",
        description: `Student marked as ${!currentStatus ? 'present' : 'absent'}.`,
      });
    }
  };

  // Mark attendance for student who hasn't checked in
  const handleMarkAttendance = async (studentId: string, isPresent: boolean) => {
    const success = await markAttendance(studentId, isPresent);
    if (success) {
      const studentName = studentAttendanceRows.find(r => r.studentId === studentId)?.studentName || 'Student';
      toast({
        title: "Attendance Marked",
        description: `${studentName} marked as ${isPresent ? 'present' : 'absent'}.`,
      });
    }
  };

  // Delete attendance record
  const handleDeleteAttendance = async (attendanceId: string, studentName: string) => {
    if (!confirm(`Are you sure you want to delete attendance record for ${studentName}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('attendance')
        .delete()
        .eq('id', attendanceId);

      if (error) throw error;

      toast({
        title: "Record Deleted",
        description: `Attendance record for ${studentName} has been deleted.`,
      });
      
      refetch();
    } catch (error) {
      console.error('Error deleting attendance:', error);
      toast({
        title: "Error",
        description: "Failed to delete attendance record.",
        variant: "destructive",
      });
    }
  };

  // Mark all students as present for today
  const handleMarkAllPresent = async () => {
    if (!confirm('Mark all students as present for today?')) return;

    try {
      const promises = students.map(student => 
        markAttendance(student.id, true)
      );

      await Promise.all(promises);
      
      toast({
        title: "Success",
        description: `Marked ${students.length} students as present.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark all students present.",
        variant: "destructive",
      });
    }
  };

  // Handle load more for infinite scroll
  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  // Get status badge
  const getStatusBadge = (row: StudentAttendanceRow) => {
    switch (row.status) {
      case 'present':
        return (
          <Badge variant="default" className="bg-emerald-100 text-emerald-800 border-emerald-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Present
          </Badge>
        );
      case 'absent':
        return (
          <Badge variant="destructive" className="bg-rose-100 text-rose-800 border-rose-200">
            <XCircle className="w-3 h-3 mr-1" />
            Absent
          </Badge>
        );
      case 'not-marked':
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            <Clock className="w-3 h-3 mr-1" />
            Not Marked
          </Badge>
        );
    }
  };

  // Debug: Log data on component render
  console.log('=== ATTENDANCE MANAGEMENT RENDER ===');
  console.log('Student attendance rows:', studentAttendanceRows.length);
  console.log('Filtered rows:', filteredRows.length);
  console.log('Loading:', loading);

  const targetDateDisplay = dateFilter ? format(dateFilter, 'MMM dd, yyyy') : 'Today';

  return (
    <PermissionGuard 
      requiredRoles={['admin', 'teacher']}
      fallbackMessage="You don't have permission to access attendance management."
    >
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent flex items-center gap-2">
              <UserCheck className="w-6 h-6 text-blue-600" />
              Attendance Management
            </h1>
            <p className="text-blue-600">View and manage student attendance records for {targetDateDisplay}</p>
          </div>
          <Button onClick={handleMarkAllPresent} disabled={isMarkingAttendance}>
            Mark All Present Today
          </Button>
        </div>

        {/* Filters */}
        <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-blue-100">
          <CardHeader>
            <CardTitle className="text-blue-900">Filters</CardTitle>
            <CardDescription className="text-blue-600">
              Filter students by name, attendance status, and date. 
              {dateFilter ? ` Showing data for ${targetDateDisplay}.` : ' Showing today\'s data.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search by student name */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-blue-900">Search Student</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 w-4 h-4" />
                  <Input
                    placeholder="Search by student name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Status filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-blue-900">Status</label>
                <Select value={statusFilter} onValueChange={(value: typeof statusFilter) => setStatusFilter(value)}>
                  <SelectTrigger className="border-blue-200 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Students</SelectItem>
                    <SelectItem value="present">Present Only</SelectItem>
                    <SelectItem value="absent">Absent Only</SelectItem>
                    <SelectItem value="not-marked">Not Marked Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-blue-900">Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal border-blue-200 text-blue-700 hover:bg-blue-50">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFilter ? format(dateFilter, "PPP") : "Today"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateFilter}
                      onSelect={setDateFilter}
                      initialFocus
                    />
                    <div className="p-3 border-t">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full border-blue-200 text-blue-700 hover:bg-blue-50"
                        onClick={() => setDateFilter(undefined)}
                      >
                        Show Today
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Table */}
        <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-blue-100">
          <CardHeader>
            <CardTitle className="text-blue-900">
              Student Attendance 
              {filteredRows.length > 0 && (
                <span className="text-sm font-normal text-blue-600 ml-2">
                  ({filteredRows.length} students)
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                <p className="text-blue-600">Loading student data...</p>
              </div>
            ) : filteredRows.length === 0 ? (
              <div className="text-center py-8 text-blue-600">
                {studentAttendanceRows.length === 0 ? (
                  "No students found in the system."
                ) : (
                  "No students match the selected filters. Try adjusting your search criteria."
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-blue-50 to-indigo-50">
                      <TableHead className="text-blue-900 font-semibold">Student</TableHead>
                      <TableHead className="text-blue-900 font-semibold">Date</TableHead>
                      <TableHead className="text-blue-900 font-semibold">Status</TableHead>
                      <TableHead className="text-blue-900 font-semibold">Marked At</TableHead>
                      <TableHead className="text-blue-900 font-semibold">Marked By</TableHead>
                      <TableHead className="text-right text-blue-900 font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-blue-100">
                    {filteredRows.map((row) => (
                      <TableRow key={row.studentId} className="hover:bg-blue-50/50 transition-colors">
                        <TableCell className="font-medium text-blue-900">
                          {row.studentName}
                        </TableCell>
                        <TableCell className="text-gray-700">
                          {targetDateDisplay}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(row)}
                        </TableCell>
                        <TableCell className="text-gray-700">
                          {row.attendanceRecord?.marked_at ? (
                            format(new Date(row.attendanceRecord.marked_at), 'MMM dd, h:mm a')
                          ) : (
                            <span className="text-gray-400">Not marked</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">
                            {row.attendanceRecord?.marked_by ? 'Self-checked' : row.status !== 'not-marked' ? 'Manual' : '—'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {row.status === 'not-marked' ? (
                              // Show mark present/absent buttons for unmarked students
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleMarkAttendance(row.studentId, true)}
                                  disabled={isMarkingAttendance}
                                  className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200"
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Present
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleMarkAttendance(row.studentId, false)}
                                  disabled={isMarkingAttendance}
                                  className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                                >
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Absent
                                </Button>
                              </>
                            ) : (
                              // Show toggle and delete for marked students
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleToggleAttendance(row.studentId, row.attendanceRecord!.is_present)}
                                  disabled={isMarkingAttendance}
                                  className="border-blue-200 text-blue-700 hover:bg-blue-50"
                                >
                                  <Edit className="w-3 h-3 mr-1" />
                                  Toggle
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteAttendance(row.attendanceRecord!.id, row.studentName)}
                                  className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PermissionGuard>
  );
};

export default AttendanceManagement; 