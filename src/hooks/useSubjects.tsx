
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

export interface Subject {
  id: string;
  name: string;
  color: string | null;
  created_at: string;
}

const fetchSubjects = async (): Promise<Subject[]> => {
  console.log('useSubjects: Fetching subjects from database...');
  
  const { data, error } = await supabase
    .from('subjects')
    .select('*')
    .order('name');

  if (error) {
    console.error('useSubjects: Error fetching subjects:', error);
    throw error;
  }

  console.log('useSubjects: Successfully fetched subjects:', data);
  return data || [];
};

let globalSubjectsChannel: any = null;
let subjectsSubscriberCount = 0;

export const useSubjects = () => {
  const queryClient = useQueryClient();
  const hasSubscribed = useRef(false);

  const query = useQuery({
    queryKey: ['subjects'],
    queryFn: fetchSubjects,
  });

  useEffect(() => {
    // Prevent multiple subscriptions from the same component
    if (hasSubscribed.current) {
      console.log('useSubjects: Already subscribed to real-time');
      return;
    }

    console.log('useSubjects: Setting up real-time subscription');
    subjectsSubscriberCount++;
    hasSubscribed.current = true;

    // Create global channel if it doesn't exist
    if (!globalSubjectsChannel) {
      console.log('useSubjects: Creating new global channel');
      globalSubjectsChannel = supabase
        .channel('subjects-changes-global')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'subjects'
          },
          (payload) => {
            console.log('useSubjects: Real-time change detected:', payload);
            queryClient.invalidateQueries({ queryKey: ['subjects'] });
          }
        );

      globalSubjectsChannel.subscribe((status: string) => {
        console.log('useSubjects: Subscription status:', status);
      });
    } else {
      console.log('useSubjects: Using existing global channel');
    }

    return () => {
      console.log('useSubjects: Cleaning up real-time subscription');
      subjectsSubscriberCount--;
      hasSubscribed.current = false;

      // Only cleanup the global channel if no more subscribers
      if (subjectsSubscriberCount <= 0 && globalSubjectsChannel) {
        console.log('useSubjects: Removing global channel');
        supabase.removeChannel(globalSubjectsChannel);
        globalSubjectsChannel = null;
        subjectsSubscriberCount = 0;
      }
    };
  }, [queryClient]);

  return {
    subjects: query.data || [],
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};
