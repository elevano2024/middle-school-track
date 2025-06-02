
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Subject {
  id: string;
  name: string;
  created_at: string;
}

export const useSubjects = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<any>(null);

  const fetchSubjects = async () => {
    try {
      console.log('useSubjects: Fetching subjects...');
      setLoading(true);
      
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .order('name');

      if (error) {
        console.error('useSubjects: Error fetching subjects:', error);
        setSubjects([]);
      } else {
        console.log('useSubjects: Successfully fetched subjects:', data);
        setSubjects(data || []);
      }
    } catch (error) {
      console.error('useSubjects: Error fetching subjects:', error);
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Always fetch subjects immediately - they are public data
    console.log('useSubjects: Initial fetch triggered');
    fetchSubjects();
  }, []);

  // Set up real-time subscription for subjects changes
  useEffect(() => {
    // Clean up existing channel if it exists
    if (channelRef.current) {
      console.log('useSubjects: Removing existing subjects channel');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channelName = `subjects-changes-${Date.now()}`;
    console.log('useSubjects: Setting up real-time channel:', channelName);
    
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subjects' }, (payload) => {
        console.log('useSubjects: Subjects data changed, refetching...', payload);
        fetchSubjects();
      })
      .subscribe((status) => {
        console.log('useSubjects: Channel subscription status:', status);
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        console.log('useSubjects: Cleaning up subjects channel');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []);

  return { subjects, loading, refetch: fetchSubjects };
};
