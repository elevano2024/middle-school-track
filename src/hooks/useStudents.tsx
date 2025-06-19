
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';

export interface Student {
  id: string;
  name: string;
  grade: string;
  created_at: string;
  updated_at: string;
}

export const useStudents = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { isAdmin, isTeacher } = useUserRole();

  const fetchStudents = async () => {
    if (!user || (!isAdmin && !isTeacher)) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching students:', error);
      } else {
        setStudents(data || []);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [user, isAdmin, isTeacher]);

  // Real-time subscription is now handled centrally in useRealtimeSubscriptions
  // No individual subscription needed here

  return { students, loading, refetch: fetchStudents };
};
