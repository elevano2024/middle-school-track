
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';

export interface Subject {
  id: string;
  name: string;
  created_at: string;
}

export const useSubjects = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { isAdmin, isTeacher, isStudent } = useUserRole();

  const fetchSubjects = async () => {
    // Allow students to fetch subjects too, not just admins and teachers
    if (!user || (!isAdmin && !isTeacher && !isStudent)) {
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching subjects for user role:', { isAdmin, isTeacher, isStudent });
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching subjects:', error);
      } else {
        console.log('Successfully fetched subjects:', data);
        setSubjects(data || []);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, [user, isAdmin, isTeacher, isStudent]);

  // Set up real-time subscription for all authenticated users
  useEffect(() => {
    if (!user || (!isAdmin && !isTeacher && !isStudent)) return;

    const channel = supabase
      .channel('subjects-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subjects' }, () => {
        console.log('Subjects data changed, refetching...');
        fetchSubjects();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isAdmin, isTeacher, isStudent]);

  return { subjects, loading, refetch: fetchSubjects };
};
