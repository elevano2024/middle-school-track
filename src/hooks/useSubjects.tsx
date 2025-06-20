import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';

export interface Subject {
  id: string;
  name: string;
  color: string | null;
  created_at: string;
}

export const useSubjects = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false); // Changed to false for silent loading
  const { user } = useAuth();
  const { isAdmin, isTeacher, loading: roleLoading } = useUserRole();

  const fetchSubjects = async () => {
    // Don't fetch if user role is still loading or user doesn't have permission
    if (roleLoading || !user || (!isAdmin && !isTeacher)) {
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching subjects:', error);
      } else {
        setSubjects(data || []);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteSubject = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('subjects')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting subject:', error);
        return false;
      }

      // Optimistically update the local state
      setSubjects(prevSubjects => prevSubjects.filter(subject => subject.id !== id));
      return true;
    } catch (error) {
      console.error('Error deleting subject:', error);
      return false;
    }
  };

  useEffect(() => {
    // Only fetch when role loading is complete and user has appropriate role
    if (!roleLoading && user && (isAdmin || isTeacher)) {
      fetchSubjects();
    }
  }, [user, isAdmin, isTeacher, roleLoading]);

  return { subjects, loading, refetch: fetchSubjects, deleteSubject };
};
