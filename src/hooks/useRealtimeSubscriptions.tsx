
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

export const useRealtimeSubscriptions = () => {
  const queryClient = useQueryClient();
  const channelRef = useRef<any>(null);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    // Prevent multiple initializations
    if (isInitializedRef.current) {
      return;
    }

    console.log('=== INITIALIZING REAL-TIME SUBSCRIPTIONS ===');
    
    // Create a single channel for all real-time updates
    const channel = supabase
      .channel('database-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks'
        },
        (payload) => {
          console.log('=== REAL-TIME TASK CHANGE DETECTED ===');
          console.log('Payload:', payload);
          queryClient.invalidateQueries({ queryKey: ['tasks'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subjects'
        },
        (payload) => {
          console.log('=== REAL-TIME SUBJECT CHANGE DETECTED ===');
          console.log('Payload:', payload);
          queryClient.invalidateQueries({ queryKey: ['subjects'] });
        }
      );

    // Subscribe to the channel
    channel.subscribe((status) => {
      console.log('=== REAL-TIME SUBSCRIPTION STATUS ===');
      console.log('Status:', status);
      if (status === 'SUBSCRIBED') {
        isInitializedRef.current = true;
      }
    });

    channelRef.current = channel;

    // Cleanup function
    return () => {
      console.log('=== CLEANING UP REAL-TIME SUBSCRIPTIONS ===');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        isInitializedRef.current = false;
      }
    };
  }, [queryClient]);

  return null;
};
