
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

export const useTasksRealtime = () => {
  const queryClient = useQueryClient();
  const channelRef = useRef<any>(null);
  const isSubscribedRef = useRef(false);

  useEffect(() => {
    console.log('=== SETTING UP REAL-TIME SUBSCRIPTION ===');
    
    // Clean up existing subscription if it exists
    if (channelRef.current) {
      console.log('=== CLEANING UP EXISTING SUBSCRIPTION ===');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      isSubscribedRef.current = false;
    }

    // Only create subscription if we don't already have one
    if (!isSubscribedRef.current) {
      const channel = supabase
        .channel('tasks-changes')
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
            
            // Invalidate and refetch tasks
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
          }
        );

      // Subscribe to the channel
      channel.subscribe((status) => {
        console.log('=== REAL-TIME SUBSCRIPTION STATUS ===');
        console.log('Status:', status);
        if (status === 'SUBSCRIBED') {
          isSubscribedRef.current = true;
        }
      });

      channelRef.current = channel;
    }

    // Cleanup function
    return () => {
      console.log('=== CLEANING UP REAL-TIME SUBSCRIPTION ===');
      if (channelRef.current) {
        console.log('=== REAL-TIME SUBSCRIPTION STATUS ===');
        console.log('Status:', channelRef.current.state);
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        isSubscribedRef.current = false;
      }
    };
  }, []); // Empty dependency array to run only once

  return null;
};
