
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';

export interface AttendanceRecord {
  id: string;
  student_id: string;
  date: string;
  is_present: boolean;
  marked_at: string | null;
  marked_by: string | null;
  created_at: string;
  updated_at: string;
}

export const useAttendance = (date?: string) => {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { isAdmin, isTeacher } = useUserRole();

  const fetchAttendance = async () => {
    if (!user || (!isAdmin && !isTeacher)) {
      setLoading(false);
      return;
    }

    try {
      const targetDate = date || new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('date', targetDate)
        .order('created_at');

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

  const markAttendance = async (studentId: string, isPresent: boolean, targetDate?: string) => {
    if (!user || (!isAdmin && !isTeacher)) {
      return false;
    }

    try {
      const dateToUse = targetDate || new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('attendance')
        .upsert({
          student_id: studentId,
          date: dateToUse,
          is_present: isPresent,
          marked_by: user.id,
          marked_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'student_id,date'
        })
        .select();

      if (error) {
        console.error('Error marking attendance:', error);
        return false;
      }

      await fetchAttendance();
      return true;
    } catch (error) {
      console.error('Error marking attendance:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [user, isAdmin, isTeacher, date]);

  // Real-time subscription is now handled centrally in useRealtimeSubscriptions
  // No individual subscription needed here

  const getAttendanceForStudent = (studentId: string) => {
    return attendance.find(record => record.student_id === studentId);
  };

  return { 
    attendance, 
    loading, 
    refetch: fetchAttendance, 
    markAttendance,
    getAttendanceForStudent
  };
};
