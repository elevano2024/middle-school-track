
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Subject {
  id: string;
  name: string;
  created_at: string;
}

// Global channel reference to prevent multiple subscriptions
let globalSubjectsChannel: any = null;
let globalSubjectsSubscribers = 0;

export const useSubjects = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const isSubscribedRef = useRef(false);

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
    // Increment subscriber count
    globalSubjectsSubscribers++;
    console.log('useSubjects: Subscriber count:', globalSubjectsSubscribers);

    // Only create channel if it doesn't exist
    if (!globalSubjectsChannel) {
      const channelName = `subjects-changes-${Date.now()}-${Math.random()}`;
      console.log('useSubjects: Setting up real-time channel:', channelName);
      
      globalSubjectsChannel = supabase.channel(channelName);
      
      globalSubjectsChannel
        .on('postgres_changes', { event: '*', schema: 'public', table: 'subjects' }, (payload) => {
          console.log('useSubjects: Subjects data changed, refetching...', payload);
          fetchSubjects();
        })
        .subscribe((status) => {
          console.log('useSubjects: Channel subscription status:', status);
        });
      
      isSubscribedRef.current = true;
    }

    return () => {
      // Decrement subscriber count
      globalSubjectsSubscribers--;
      console.log('useSubjects: Cleaning up, remaining subscribers:', globalSubjectsSubscribers);
      
      // Only clean up the channel when no more subscribers
      if (globalSubjectsSubscribers <= 0 && globalSubjectsChannel) {
        console.log('useSubjects: Cleaning up global subjects channel');
        try {
          supabase.removeChannel(globalSubjectsChannel);
        } catch (error) {
          console.log('useSubjects: Error cleaning up channel:', error);
        }
        globalSubjectsChannel = null;
        isSubscribedRef.current = false;
        globalSubjectsSubscribers = 0; // Reset to 0 to be safe
      }
    };
  }, []); // Empty dependency array to run only once per component instance

  return { subjects, loading, refetch: fetchSubjects };
};
