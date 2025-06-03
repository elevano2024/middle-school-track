
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Subject {
  id: string;
  name: string;
  created_at: string;
}

// Global channel management
let globalSubjectsChannel: any = null;
let globalSubjectsSubscribers = 0;
let globalSubjectsCallbacks: Set<() => void> = new Set();

export const useSubjects = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const callbackRef = useRef<() => void>();

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

  // Store the fetchSubjects function in a ref so it can be called by real-time updates
  callbackRef.current = fetchSubjects;

  useEffect(() => {
    // Always fetch subjects immediately
    console.log('useSubjects: Initial fetch triggered');
    fetchSubjects();
  }, []);

  // Set up real-time subscription
  useEffect(() => {
    // Increment subscriber count
    globalSubjectsSubscribers++;
    console.log('useSubjects: Subscriber count:', globalSubjectsSubscribers);

    // Add this callback to the global set
    if (callbackRef.current) {
      globalSubjectsCallbacks.add(callbackRef.current);
    }

    // Only create and subscribe to channel if it doesn't exist
    if (!globalSubjectsChannel) {
      const channelName = `subjects-changes-${Date.now()}-${Math.random()}`;
      console.log('useSubjects: Creating and subscribing to new subjects channel:', channelName);
      
      globalSubjectsChannel = supabase.channel(channelName);
      
      globalSubjectsChannel
        .on('postgres_changes', { event: '*', schema: 'public', table: 'subjects' }, (payload) => {
          console.log('useSubjects: Subjects data changed, notifying all subscribers...', payload);
          // Notify all subscribers
          globalSubjectsCallbacks.forEach(callback => {
            try {
              callback();
            } catch (error) {
              console.error('Error calling subjects callback:', error);
            }
          });
        })
        .subscribe((status) => {
          console.log('useSubjects: Channel subscription status:', status);
        });
    } else {
      console.log('useSubjects: Using existing subjects channel');
    }

    return () => {
      // Decrement subscriber count
      globalSubjectsSubscribers--;
      console.log('useSubjects: Cleaning up, remaining subscribers:', globalSubjectsSubscribers);
      
      // Remove this callback from the global set
      if (callbackRef.current) {
        globalSubjectsCallbacks.delete(callbackRef.current);
      }
      
      // Only clean up the channel when no more subscribers
      if (globalSubjectsSubscribers <= 0 && globalSubjectsChannel) {
        console.log('useSubjects: Cleaning up global subjects channel');
        try {
          supabase.removeChannel(globalSubjectsChannel);
        } catch (error) {
          console.log('useSubjects: Error cleaning up channel:', error);
        }
        globalSubjectsChannel = null;
        globalSubjectsSubscribers = 0;
        globalSubjectsCallbacks.clear();
      }
    };
  }, []);

  return { subjects, loading, refetch: fetchSubjects };
};
