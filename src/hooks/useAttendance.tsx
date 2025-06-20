import { useState, useEffect } from 'react';
import { useQuery, useQueryClient, useMutation, useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';

export interface Attendance {
  id: string;
  student_id: string;
  date: string;
  is_present: boolean;
  marked_at: string | null;
  marked_by: string | null;
  created_at: string;
  updated_at: string;
}

interface AttendancePageResponse {
  data: Attendance[];
  nextCursor: number | null;
  hasMore: boolean;
}

// Helper function to check if today is a school day (Monday-Friday)
const isSchoolDay = (date = new Date()) => {
  const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  return dayOfWeek >= 1 && dayOfWeek <= 5; // Monday (1) through Friday (5)
};

// Helper function to get current school day date
const getCurrentSchoolDate = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

// PRODUCTION FIX: Separate hook for students - NO infinite query
const useStudentAttendance = (user: any, today: string, isTodaySchoolDay: boolean) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const studentQuery = useQuery({
    queryKey: ['attendance', 'student', user?.id, today],
    queryFn: async (): Promise<Attendance[]> => {
      if (!user?.id) return [];

      console.log('=== FETCHING STUDENT ATTENDANCE ===');
      console.log('Student ID:', user.id);
      console.log('Date:', today);

      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', user.id)
        .eq('date', today)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching student attendance:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!user?.id && isTodaySchoolDay,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  const markAttendanceMutation = useMutation({
    mutationFn: async ({ studentId, isPresent }: { studentId: string; isPresent: boolean }) => {
      if (!isTodaySchoolDay) {
        throw new Error('Attendance can only be marked on school days (Monday-Friday)');
      }

      const attendanceData = {
        student_id: studentId,
        date: today,
        is_present: isPresent,
        marked_by: user?.id || null,
        marked_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('attendance')
        .upsert(attendanceData, { onConflict: 'student_id,date' })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, { isPresent }) => {
      const action = isPresent ? 'present' : 'absent';
      toast({
        title: "Attendance Updated",
        description: `Successfully marked as ${action} for today.`,
      });
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to mark attendance. Please try again.",
        variant: "destructive",
      });
    },
  });

  return {
    data: studentQuery.data || [],
    loading: studentQuery.isLoading,
    error: studentQuery.error,
    markAttendance: markAttendanceMutation.mutateAsync,
    isMarkingAttendance: markAttendanceMutation.isPending,
    refetch: studentQuery.refetch,
  };
};

// PRODUCTION FIX: Separate hook for teachers/admins - WITH infinite query
const useTeacherAdminAttendance = (user: any, dateFilter?: Date) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const PAGE_SIZE = 20;
  const today = getCurrentSchoolDate();

  // For main dashboard (no dateFilter): get ALL today's attendance records
  // For AttendanceManagement (with dateFilter): use pagination
  const shouldUsePagination = dateFilter !== undefined;

  const infiniteQuery = useInfiniteQuery({
    queryKey: ['attendance', 'all', dateFilter?.toISOString()],
    queryFn: async ({ pageParam = 0 }): Promise<AttendancePageResponse> => {
      let query = supabase
        .from('attendance')
        .select('*')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (dateFilter) {
        // AttendanceManagement page with specific date filter
        const filterDateString = dateFilter.toISOString().split('T')[0];
        query = query.eq('date', filterDateString);
        // Apply pagination for AttendanceManagement
        query = query.range(pageParam * PAGE_SIZE, (pageParam + 1) * PAGE_SIZE - 1);
      } else {
        // Main dashboard: get ALL today's records (no pagination)
        query = query.eq('date', today);
        console.log('=== FETCHING ALL TODAY\'S ATTENDANCE FOR DASHBOARD ===');
        console.log('Date:', today);
      }

      const { data, error } = await query;
      if (error) {
        console.error('Error fetching attendance:', error);
        throw error;
      }

      const attendanceData = data || [];
      console.log(`Fetched ${attendanceData.length} attendance records`);

      // For main dashboard (no dateFilter), we get all records so no pagination needed
      if (!dateFilter) {
        return { data: attendanceData, nextCursor: null, hasMore: false };
      }

      // For AttendanceManagement (with dateFilter), use pagination
      const hasMore = attendanceData.length === PAGE_SIZE;
      const nextCursor = hasMore ? pageParam + 1 : null;
      return { data: attendanceData, nextCursor, hasMore };
    },
    getNextPageParam: (lastPage) => lastPage?.nextCursor || undefined,
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    initialPageParam: 0,
  });

  const markAttendanceMutation = useMutation({
    mutationFn: async ({ studentId, isPresent }: { studentId: string; isPresent: boolean }) => {
      const attendanceData = {
        student_id: studentId,
        date: today,
        is_present: isPresent,
        marked_by: user?.id || null,
        marked_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('attendance')
        .upsert(attendanceData, { onConflict: 'student_id,date' })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to mark attendance.",
        variant: "destructive",
      });
    },
  });

  const allAttendanceRecords = infiniteQuery.data?.pages?.reduce<Attendance[]>((acc, page) => {
    if (!page?.data || !Array.isArray(page.data)) return acc;
    return acc.concat(page.data);
  }, []) || [];

  return {
    data: allAttendanceRecords,
    loading: infiniteQuery.isLoading,
    error: infiniteQuery.error,
    markAttendance: markAttendanceMutation.mutateAsync,
    isMarkingAttendance: markAttendanceMutation.isPending,
    refetch: infiniteQuery.refetch,
    hasNextPage: shouldUsePagination ? (infiniteQuery.hasNextPage || false) : false,
    fetchNextPage: infiniteQuery.fetchNextPage,
    isFetchingNextPage: infiniteQuery.isFetchingNextPage || false,
  };
};

// PRODUCTION MAIN HOOK: Routes to appropriate sub-hook
export const useAttendance = (dateFilter?: Date) => {
  const { user } = useAuth();
  const { isAdmin, isTeacher, isStudent, loading: roleLoading } = useUserRole();
  const today = getCurrentSchoolDate();
  const isTodaySchoolDay = isSchoolDay();

  // CRITICAL: Early return while role is loading
  if (roleLoading || !user?.id) {
    return {
      attendance: [],
      loading: true,
      error: null,
      markAttendance: async () => false,
      getAttendanceForStudent: () => undefined,
      getMyAttendance: () => null,
      isMarkingAttendance: false,
      refetch: () => Promise.resolve(),
      isSchoolDay: isTodaySchoolDay,
      currentDate: today,
      hasNextPage: false,
      fetchNextPage: () => Promise.resolve(),
      isFetchingNextPage: false,
    };
  }

  const isStudentUser = isStudent && !isAdmin && !isTeacher;
  const isTeacherAdmin = isAdmin || isTeacher;

  // PRODUCTION FIX: Route to appropriate hook based on user type
  const studentData = useStudentAttendance(user, today, isTodaySchoolDay);
  const teacherAdminData = useTeacherAdminAttendance(user, dateFilter);

  // Choose the right data source
  const activeData = isStudentUser ? studentData : teacherAdminData;

  // Helper functions
  const getAttendanceForStudent = (studentId: string, date?: string) => {
    const searchDate = date || today;
    return activeData.data.find((att: Attendance) => 
      att && att.student_id === studentId && att.date === searchDate
    );
  };

  const getMyAttendance = () => {
    if (!user?.id) return null;
    return getAttendanceForStudent(user.id);
  };

  const markAttendance = async (studentId: string, isPresent: boolean) => {
    if (!user) return false;
    if (!isTodaySchoolDay) return false;
    if (isStudent && studentId !== user.id) return false;

    try {
      await activeData.markAttendance({ studentId, isPresent });
      return true;
    } catch (error) {
      console.error('Failed to mark attendance:', error);
      return false;
    }
  };

  return {
    attendance: Array.isArray(activeData.data) ? activeData.data : [],
    loading: activeData.loading,
    error: activeData.error,
    markAttendance,
    getAttendanceForStudent,
    getMyAttendance,
    isMarkingAttendance: activeData.isMarkingAttendance,
    refetch: activeData.refetch,
    isSchoolDay: isTodaySchoolDay,
    currentDate: today,
    // Only provide infinite query props for teachers/admins
    hasNextPage: isTeacherAdmin ? (teacherAdminData.hasNextPage || false) : false,
    fetchNextPage: isTeacherAdmin ? teacherAdminData.fetchNextPage : () => Promise.resolve(),
    isFetchingNextPage: isTeacherAdmin ? (teacherAdminData.isFetchingNextPage || false) : false,
  };
};
