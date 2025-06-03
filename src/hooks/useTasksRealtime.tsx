
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Global channel management
let globalTasksChannel: any = null;
let globalTasksSubscribers = 0;
let globalTasksCallbacks: Set<() => void> = new Set();
let globalUpdatingTasksCallbacks: Set<React.MutableRefObject<Set<string>>> = new Set();
let globalTasksChannelPromise: Promise<any> | null = null;

interface UseTasksRealtimeProps {
  userId: string | undefined;
  onTasksChanged: () => void;
  updatingTasksRef: React.MutableRefObject<Set<string>>;
}

export const useTasksRealtime = ({ userId, onTasksChanged, updatingTasksRef }: UseTasksRealtimeProps) => {
  const callbackRef = useRef(onTasksChanged);
  const updatingRef = useRef(updatingTasksRef);

  // Update refs when props change
  useEffect(() => {
    callbackRef.current = onTasksChanged;
    updatingRef.current = updatingTasksRef;
  }, [onTasksChanged, updatingTasksRef]);

  useEffect(() => {
    if (!userId) return;

    // Increment subscriber count
    globalTasksSubscribers++;
    console.log('useTasksRealtime: Subscriber count:', globalTasksSubscribers);

    // Add this callback to the global set
    globalTasksCallbacks.add(callbackRef.current);
    globalUpdatingTasksCallbacks.add(updatingRef.current);

    // Create and subscribe to channel if it doesn't exist, preventing race conditions
    const setupChannel = async () => {
      if (!globalTasksChannel && !globalTasksChannelPromise) {
        const channelName = `tasks-changes-${Date.now()}-${Math.random()}`;
        console.log('Creating and subscribing to new tasks channel:', channelName);
        
        globalTasksChannelPromise = new Promise((resolve) => {
          globalTasksChannel = supabase.channel(channelName);
          
          globalTasksChannel
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload) => {
              console.log('Tasks data changed via real-time:', payload);
              
              // Check if any subscriber is updating this task
              const taskId = (payload.new as any)?.id || (payload.old as any)?.id;
              let shouldSkip = false;
              
              if (taskId) {
                for (const updatingTasksRef of globalUpdatingTasksCallbacks) {
                  if (updatingTasksRef.current.has(taskId)) {
                    shouldSkip = true;
                    break;
                  }
                }
              }
              
              if (!shouldSkip) {
                console.log('Notifying all task subscribers of external change');
                // Notify all subscribers
                globalTasksCallbacks.forEach(callback => {
                  try {
                    callback();
                  } catch (error) {
                    console.error('Error calling task callback:', error);
                  }
                });
              } else {
                console.log('Skipping refetch for self-initiated update');
              }
            })
            .subscribe((status) => {
              console.log('Tasks channel subscription status:', status);
              resolve(globalTasksChannel);
            });
        });
        
        await globalTasksChannelPromise;
        globalTasksChannelPromise = null;
      } else if (globalTasksChannelPromise) {
        // Wait for existing channel creation to complete
        await globalTasksChannelPromise;
        console.log('Using existing tasks channel');
      } else {
        console.log('Using existing tasks channel');
      }
    };

    setupChannel();

    return () => {
      // Decrement subscriber count
      globalTasksSubscribers--;
      console.log('useTasksRealtime: Cleaning up, remaining subscribers:', globalTasksSubscribers);
      
      // Remove this callback from the global set
      globalTasksCallbacks.delete(callbackRef.current);
      globalUpdatingTasksCallbacks.delete(updatingRef.current);
      
      // Only clean up the channel when no more subscribers
      if (globalTasksSubscribers <= 0 && globalTasksChannel) {
        console.log('Cleaning up global tasks channel');
        try {
          supabase.removeChannel(globalTasksChannel);
        } catch (error) {
          console.log('Error cleaning up tasks channel:', error);
        }
        globalTasksChannel = null;
        globalTasksSubscribers = 0;
        globalTasksCallbacks.clear();
        globalUpdatingTasksCallbacks.clear();
        globalTasksChannelPromise = null;
      }
    };
  }, [userId]);
};
