
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Global channel reference to prevent multiple subscriptions
let globalTasksChannel: any = null;
let globalTasksSubscribers = 0;

interface UseTasksRealtimeProps {
  userId: string | undefined;
  onTasksChanged: () => void;
  updatingTasksRef: React.MutableRefObject<Set<string>>;
}

export const useTasksRealtime = ({ userId, onTasksChanged, updatingTasksRef }: UseTasksRealtimeProps) => {
  const isSubscribedRef = useRef(false);

  useEffect(() => {
    if (!userId) return;

    // Increment subscriber count
    globalTasksSubscribers++;
    console.log('useTasksRealtime: Subscriber count:', globalTasksSubscribers);

    // Only create channel if it doesn't exist
    if (!globalTasksChannel) {
      const channelName = `tasks-changes-${userId}-${Date.now()}-${Math.random()}`;
      console.log('Creating new channel:', channelName);
      
      globalTasksChannel = supabase.channel(channelName);
      
      globalTasksChannel
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload) => {
          console.log('Tasks data changed via real-time:', payload);
          
          // Only refetch if this wasn't an update we initiated
          const taskId = (payload.new as any)?.id || (payload.old as any)?.id;
          if (taskId && !updatingTasksRef.current.has(taskId)) {
            console.log('Refetching tasks due to external change');
            onTasksChanged();
          } else {
            console.log('Skipping refetch for self-initiated update');
          }
        })
        .subscribe((status) => {
          console.log('Channel subscription status:', status);
        });
      
      isSubscribedRef.current = true;
    }

    return () => {
      // Decrement subscriber count
      globalTasksSubscribers--;
      console.log('useTasksRealtime: Cleaning up, remaining subscribers:', globalTasksSubscribers);
      
      // Only clean up the channel when no more subscribers
      if (globalTasksSubscribers <= 0 && globalTasksChannel) {
        console.log('Cleaning up global tasks channel');
        try {
          supabase.removeChannel(globalTasksChannel);
        } catch (error) {
          console.log('Error cleaning up channel:', error);
        }
        globalTasksChannel = null;
        isSubscribedRef.current = false;
        globalTasksSubscribers = 0; // Reset to 0 to be safe
      }
    };
  }, [userId, onTasksChanged, updatingTasksRef]);
};
