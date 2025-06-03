
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Global channel manager that ensures only one subscription per channel
class TasksChannelManager {
  private static instance: TasksChannelManager;
  private channel: any = null;
  private subscribers: Set<() => void> = new Set();
  private updatingTasksRefs: Set<React.MutableRefObject<Set<string>>> = new Set();
  private isSubscribed = false;
  private isSubscribing = false;

  static getInstance(): TasksChannelManager {
    if (!TasksChannelManager.instance) {
      TasksChannelManager.instance = new TasksChannelManager();
    }
    return TasksChannelManager.instance;
  }

  async subscribe(callback: () => void, updatingTasksRef: React.MutableRefObject<Set<string>>): Promise<void> {
    this.subscribers.add(callback);
    this.updatingTasksRefs.add(updatingTasksRef);
    console.log('useTasksRealtime: Added subscriber, total:', this.subscribers.size);

    // If already subscribed, nothing more to do
    if (this.isSubscribed) {
      console.log('useTasksRealtime: Already subscribed, using existing channel');
      return;
    }

    // If currently subscribing, wait for it to complete
    if (this.isSubscribing) {
      console.log('useTasksRealtime: Subscription in progress, waiting...');
      while (this.isSubscribing) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      return;
    }

    // Start subscribing
    this.isSubscribing = true;
    console.log('useTasksRealtime: Creating and subscribing to new tasks channel');

    try {
      // Create a unique channel name
      const channelName = `tasks-changes-${Date.now()}-${Math.random()}`;
      this.channel = supabase.channel(channelName);
      
      // Set up the channel with event handlers
      this.channel.on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'tasks' 
      }, (payload) => {
        console.log('useTasksRealtime: Database change detected via real-time:', payload);
        
        // Check if any subscriber is updating this task
        const taskId = (payload.new as any)?.id || (payload.old as any)?.id;
        let shouldSkip = false;
        
        if (taskId) {
          for (const updatingTasksRef of this.updatingTasksRefs) {
            if (updatingTasksRef.current.has(taskId)) {
              shouldSkip = true;
              break;
            }
          }
        }
        
        if (!shouldSkip) {
          console.log('useTasksRealtime: Notifying all subscribers of external change');
          this.subscribers.forEach(callback => {
            try {
              callback();
            } catch (error) {
              console.error('Error calling task callback:', error);
            }
          });
        } else {
          console.log('useTasksRealtime: Skipping refetch for self-initiated update');
        }
      });

      // Subscribe to the channel (this should only happen once per channel instance)
      await new Promise<void>((resolve, reject) => {
        this.channel.subscribe((status) => {
          console.log('useTasksRealtime: Channel subscription status:', status);
          if (status === 'SUBSCRIBED') {
            this.isSubscribed = true;
            this.isSubscribing = false;
            resolve();
          } else if (status === 'CHANNEL_ERROR') {
            this.isSubscribing = false;
            reject(new Error('Channel subscription failed'));
          }
        });
      });
    } catch (error) {
      console.error('Error creating tasks channel:', error);
      this.isSubscribing = false;
      this.isSubscribed = false;
    }
  }

  unsubscribe(callback: () => void, updatingTasksRef: React.MutableRefObject<Set<string>>): void {
    this.subscribers.delete(callback);
    this.updatingTasksRefs.delete(updatingTasksRef);
    console.log('useTasksRealtime: Removed subscriber, remaining:', this.subscribers.size);

    // If no more subscribers, cleanup the channel
    if (this.subscribers.size === 0 && this.channel) {
      console.log('useTasksRealtime: No more subscribers, cleaning up channel');
      try {
        supabase.removeChannel(this.channel);
      } catch (error) {
        console.log('useTasksRealtime: Error cleaning up channel:', error);
      }
      this.channel = null;
      this.isSubscribed = false;
      this.isSubscribing = false;
    }
  }
}

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

    const manager = TasksChannelManager.getInstance();
    const callback = callbackRef.current;
    const updatingTasksRef = updatingRef.current;

    manager.subscribe(callback, updatingTasksRef);

    return () => {
      manager.unsubscribe(callback, updatingTasksRef);
    };
  }, [userId]);
};
