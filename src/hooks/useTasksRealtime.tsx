
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

let globalChannel: any = null;
let subscriberCount = 0;

export const useTasksRealtime = () => {
  const queryClient = useQueryClient();
  const hasSubscribed = useRef(false);

  useEffect(() => {
    // Prevent multiple subscriptions from the same component
    if (hasSubscribed.current) {
      console.log('=== ALREADY SUBSCRIBED TO REAL-TIME ===');
      return;
    }

    console.log('=== SETTING UP REAL-TIME SUBSCRIPTION ===');
    subscriberCount++;
    hasSubscribed.current = true;

    // Create global channel if it doesn't exist
    if (!globalChannel) {
      console.log('=== CREATING NEW GLOBAL CHANNEL ===');
      globalChannel = supabase
        .channel('tasks-changes-global')
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
      globalChannel.subscribe((status: string) => {
        console.log('=== REAL-TIME SUBSCRIPTION STATUS ===');
        console.log('Status:', status);
      });
    } else {
      console.log('=== USING EXISTING GLOBAL CHANNEL ===');
    }

    // Cleanup function
    return () => {
      console.log('=== CLEANING UP REAL-TIME SUBSCRIPTION ===');
      subscriberCount--;
      hasSubscribed.current = false;

      // Only cleanup the global channel if no more subscribers
      if (subscriberCount <= 0 && globalChannel) {
        console.log('=== REMOVING GLOBAL CHANNEL ===');
        supabase.removeChannel(globalChannel);
        globalChannel = null;
        subscriberCount = 0;
      }
    };
  }, []); // Empty dependency array to run only once

  return null;
};
