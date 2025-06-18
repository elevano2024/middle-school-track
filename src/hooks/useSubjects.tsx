
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Subject {
  id: string;
  name: string;
  created_at: string;
}

export const useSubjects = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSubjects = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    // Initial fetch
    console.log('useSubjects: Initial fetch triggered');
    fetchSubjects();
  }, [fetchSubjects]);

  // Set up real-time subscription
  useEffect(() => {
    console.log('useSubjects: Setting up real-time subscription');
    
    const channel = supabase
      .channel('subjects-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'subjects' 
      }, (payload) => {
        console.log('useSubjects: Real-time change detected:', payload);
        console.log('Event type:', payload.eventType);
        
        // Refetch subjects when any change occurs
        fetchSubjects();
      })
      .subscribe((status) => {
        console.log('useSubjects: Subscription status:', status);
      });

    return () => {
      console.log('useSubjects: Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [fetchSubjects]);

  return { subjects, loading, refetch: fetchSubjects };
};
