
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseTasksRealtimeProps {
  userId: string | undefined;
  onTasksChanged: () => void;
  updatingTasksRef: React.MutableRefObject<Set<string>>;
}

export const useTasksRealtime = ({ userId, onTasksChanged, updatingTasksRef }: UseTasksRealtimeProps) => {
  const channelRef = useRef<any>(null);
  const callbackRef = useRef(onTasksChanged);
  const updatingRef = useRef(updatingTasksRef);

  // Update refs when props change
  useEffect(() => {
    callbackRef.current = onTasksChanged;
    updatingRef.current = updatingTasksRef;
  }, [onTasksChanged, updatingTasksRef]);

  useEffect(() => {
    if (!userId) return;

    console.log('=== SETTING UP REAL-TIME SUBSCRIPTION ===');
    console.log('User ID:', userId);

    // Clean up existing channel
    if (channelRef.current) {
      console.log('Cleaning up existing channel');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Create new channel with a unique name
    const channelName = `tasks-realtime-${userId}-${Date.now()}`;
    const channel = supabase.channel(channelName);
    channelRef.current = channel;

    // Set up the channel to listen for all changes on tasks table
    channel.on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'tasks' 
    }, (payload) => {
      console.log('=== REAL-TIME UPDATE RECEIVED ===');
      console.log('Event type:', payload.eventType);
      console.log('Payload:', payload);
      
      // Check if this is a self-initiated update (only for UPDATE events)
      const taskId = (payload.new as any)?.id || (payload.old as any)?.id;
      let shouldSkip = false;
      
      if (taskId && payload.eventType === 'UPDATE') {
        if (updatingRef.current.current.has(taskId)) {
          shouldSkip = true;
          console.log(`Skipping real-time update for task ${taskId} - currently being updated locally`);
        }
      }
      
      if (!shouldSkip) {
        console.log('=== TRIGGERING REAL-TIME REFRESH ===');
        console.log(`Event: ${payload.eventType}`);
        
        // Small delay for UPDATE events to ensure database consistency
        const delay = payload.eventType === 'UPDATE' ? 100 : 0;
        
        setTimeout(() => {
          try {
            console.log('Calling task refresh callback for event:', payload.eventType);
            callbackRef.current();
          } catch (error) {
            console.error('Error calling task callback:', error);
          }
        }, delay);
      } else {
        console.log('=== SKIPPING REAL-TIME REFRESH ===');
        console.log('Reason: Self-initiated update');
      }
    });

    // Subscribe to the channel
    channel.subscribe((status) => {
      console.log('=== REAL-TIME SUBSCRIPTION STATUS ===');
      console.log('Status:', status);
      if (status === 'SUBSCRIBED') {
        console.log('=== REAL-TIME SUBSCRIPTION SUCCESSFUL ===');
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.error('=== REAL-TIME SUBSCRIPTION FAILED ===');
        console.error('Status:', status);
        
        // Retry connection after a delay
        setTimeout(() => {
          console.log('Attempting to reconnect...');
          if (channelRef.current === channel) {
            // Only retry if this is still the current channel
            channel.subscribe();
          }
        }, 2000);
      }
    });

    return () => {
      console.log('=== CLEANING UP REAL-TIME SUBSCRIPTION ===');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [userId]);
};
