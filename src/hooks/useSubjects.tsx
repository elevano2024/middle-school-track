
import { useState, useEffect, useRef } from 'react';
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
  const channelRef = useRef<any>(null);

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

    // Clean up existing channel if it exists
    if (channelRef.current) {
      console.log('Removing existing subjects channel');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channelName = `subjects-changes-${user.id}-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subjects' }, () => {
        console.log('Subjects data changed, refetching...');
        fetchSubjects();
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user, isAdmin, isTeacher, isStudent]);

  return { subjects, loading, refetch: fetchSubjects };
};
