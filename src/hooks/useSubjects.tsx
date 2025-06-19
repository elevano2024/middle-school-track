
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

export const useSubjects = () => {
  const queryClient = useQueryClient();
  const channelRef = useRef<any>(null);
  const isSubscribedRef = useRef(false);

  const query = useQuery({
    queryKey: ['subjects'],
    queryFn: fetchSubjects,
  });

  useEffect(() => {
    console.log('useSubjects: Setting up real-time subscription');
    
    // Clean up existing subscription if it exists
    if (channelRef.current) {
      console.log('useSubjects: Cleaning up existing subscription');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      isSubscribedRef.current = false;
    }

    // Only create subscription if we don't already have one
    if (!isSubscribedRef.current) {
      const channel = supabase
        .channel('subjects-changes')
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

      channel.subscribe((status) => {
        console.log('useSubjects: Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          isSubscribedRef.current = true;
        }
      });

      channelRef.current = channel;
    }

    return () => {
      console.log('useSubjects: Cleaning up real-time subscription');
      if (channelRef.current) {
        console.log('useSubjects: Subscription status:', channelRef.current.state);
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        isSubscribedRef.current = false;
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
