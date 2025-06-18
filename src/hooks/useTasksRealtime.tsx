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
  private subscriptionPromise: Promise<void> | null = null;

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

    // If currently subscribing, wait for the existing subscription to complete
    if (this.isSubscribing && this.subscriptionPromise) {
      console.log('useTasksRealtime: Subscription in progress, waiting...');
      await this.subscriptionPromise;
      return;
    }

    // Start subscribing
    this.isSubscribing = true;
    console.log('useTasksRealtime: Creating and subscribing to new tasks channel');

    // Create the subscription promise
    this.subscriptionPromise = this.createSubscription();
    
    try {
      await this.subscriptionPromise;
    } catch (error) {
      console.error('Error in tasks subscription:', error);
      this.isSubscribing = false;
      this.isSubscribed = false;
      this.subscriptionPromise = null;
    }
  }

  private async createSubscription(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      try {
        // Create a unique channel name
        const channelName = `tasks-changes-${Date.now()}-${Math.random()}`;
        this.channel = supabase.channel(channelName);
        
        // Set up the channel with event handlers for all table events (INSERT, UPDATE, DELETE)
        this.channel.on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'tasks' 
        }, (payload) => {
          console.log('=== REAL-TIME UPDATE RECEIVED ===');
          console.log('Event type:', payload.eventType);
          console.log('Payload:', payload);
          
          // Check if any subscriber is updating this task (only for UPDATE events)
          const taskId = (payload.new as any)?.id || (payload.old as any)?.id;
          let shouldSkip = false;
          
          if (taskId && payload.eventType === 'UPDATE') {
            for (const updatingTasksRef of this.updatingTasksRefs) {
              if (updatingTasksRef.current.has(taskId)) {
                shouldSkip = true;
                console.log(`Skipping real-time update for task ${taskId} - currently being updated locally`);
                break;
              }
            }
          }
          
          if (!shouldSkip) {
            console.log('=== TRIGGERING REAL-TIME REFRESH ===');
            console.log(`Event: ${payload.eventType}, notifying ${this.subscribers.size} subscribers`);
            
            // For DELETE events, refresh immediately to remove from UI
            // For INSERT events, refresh immediately to show new items
            // For UPDATE events, add a small delay to ensure database consistency
            const delay = payload.eventType === 'UPDATE' ? 50 : 0;
            
            setTimeout(() => {
              this.subscribers.forEach(callback => {
                try {
                  console.log('Calling task refresh callback for event:', payload.eventType);
                  callback();
                } catch (error) {
                  console.error('Error calling task callback:', error);
                }
              });
            }, delay);
          } else {
            console.log('=== SKIPPING REAL-TIME REFRESH ===');
            console.log('Reason: Self-initiated update');
          }
        });

        // Subscribe to the channel
        this.channel.subscribe((status) => {
          console.log('=== REAL-TIME SUBSCRIPTION STATUS ===');
          console.log('Status:', status);
          if (status === 'SUBSCRIBED') {
            this.isSubscribed = true;
            this.isSubscribing = false;
            this.subscriptionPromise = null;
            console.log('=== REAL-TIME SUBSCRIPTION SUCCESSFUL ===');
            resolve();
          } else if (status === 'CHANNEL_ERROR') {
            this.isSubscribing = false;
            this.subscriptionPromise = null;
            console.error('=== REAL-TIME SUBSCRIPTION FAILED ===');
            reject(new Error('Channel subscription failed'));
          }
        });
      } catch (error) {
        this.isSubscribing = false;
        this.subscriptionPromise = null;
        reject(error);
      }
    });
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
      this.subscriptionPromise = null;
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

    console.log('=== SETTING UP REAL-TIME SUBSCRIPTION ===');
    console.log('User ID:', userId);

    manager.subscribe(callback, updatingTasksRef);

    return () => {
      console.log('=== CLEANING UP REAL-TIME SUBSCRIPTION ===');
      manager.unsubscribe(callback, updatingTasksRef);
    };
  }, [userId]);
};
