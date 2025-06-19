
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';

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

export const useAttendance = () => {
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { isAdmin, isTeacher } = useUserRole();

  const fetchTodaysAttendance = async () => {
    if (!user || (!isAdmin && !isTeacher)) {
      setLoading(false);
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('date', today);

      if (error) {
        console.error('Error fetching attendance:', error);
      } else {
        setAttendance(data || []);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAttendance = async (studentId: string, isPresent: boolean) => {
    if (!user) return false;

    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('attendance')
        .upsert({
          student_id: studentId,
          date: today,
          is_present: isPresent,
          marked_by: user.id,
          marked_at: new Date().toISOString()
        }, {
          onConflict: 'student_id,date'
        })
        .select();

      if (error) {
        console.error('Error marking attendance:', error);
        return false;
      }

      await fetchTodaysAttendance();
      return true;
    } catch (error) {
      console.error('Error marking attendance:', error);
      return false;
    }
  };

  const getAttendanceForStudent = (studentId: string) => {
    return attendance.find(att => att.student_id === studentId);
  };

  useEffect(() => {
    fetchTodaysAttendance();
  }, [user, isAdmin, isTeacher]);

  // Note: Real-time subscription is now handled by useRealtimeSubscriptions hook

  return { 
    attendance, 
    loading, 
    markAttendance, 
    getAttendanceForStudent,
    refetch: fetchTodaysAttendance 
  };
};
