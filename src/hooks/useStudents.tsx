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
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { isAdmin, isTeacher, loading: roleLoading } = useUserRole();

  const fetchStudents = async () => {
    if (roleLoading || !user || (!isAdmin && !isTeacher)) {
      return;
    }

    try {
      setLoading(true);
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
    if (!roleLoading && user && (isAdmin || isTeacher)) {
      fetchStudents();
    }
  }, [user, isAdmin, isTeacher, roleLoading]);

  // Note: Real-time subscription is now handled by useRealtimeSubscriptions hook

  return { students, loading, refetch: fetchStudents };
};
