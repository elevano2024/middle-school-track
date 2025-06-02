
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';

export interface Subject {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export const useSubjects = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { isAdmin, isTeacher } = useUserRole();

  useEffect(() => {
    const fetchSubjects = async () => {
      if (!user || (!isAdmin && !isTeacher)) {
        setLoading(false);
        return;
      }

      try {
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

    fetchSubjects();
  }, [user, isAdmin, isTeacher]);

  return { subjects, loading };
};
