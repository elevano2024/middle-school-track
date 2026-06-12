import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import type { Attendance } from '@/hooks/useAttendance';

export const useAttendanceHistory = (enabled = true) => {
  const { user } = useAuth();
  const { isAdmin, isTeacher, loading: roleLoading } = useUserRole();

  const query = useQuery({
    queryKey: ['attendance-history'],
    queryFn: async (): Promise<Attendance[]> => {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .order('date', { ascending: true });

      if (error) {
        console.error('Error fetching attendance history:', error);
        throw error;
      }

      return data || [];
    },
    enabled: enabled && !!user?.id && !roleLoading && (isAdmin || isTeacher),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  return {
    attendanceHistory: query.data || [],
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};
