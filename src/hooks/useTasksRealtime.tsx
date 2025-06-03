
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Singleton channel manager to prevent multiple subscriptions
class TasksChannelManager {
  private static instance: TasksChannelManager;
  private channel: any = null;
  private subscribers: Set<() => void> = new Set();
  private updatingTasksRefs: Set<React.MutableRefObject<Set<string>>> = new Set();
  private isInitializing = false;

  static getInstance(): TasksChannelManager {
    if (!TasksChannelManager.instance) {
      TasksChannelManager.instance = new TasksChannelManager();
    }
    return TasksChannelManager.instance;
  }

  async subscribe(callback: () => void, updatingTasksRef: React.MutableRefObject<Set<string>>): Promise<void> {
    this.subscribers.add(callback);
    this.updatingTasksRefs.add(updatingTasksRef);

    if (this.channel) {
      console.log('useTasksRealtime: Using existing channel');
      return;
    }

    if (this.isInitializing) {
      console.log('useTasksRealtime: Channel initialization in progress, waiting...');
      // Wait for initialization to complete
      while (this.isInitializing) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      return;
    }

    this.isInitializing = true;
    console.log('useTasksRealtime: Creating new tasks channel');

    try {
      const channelName = `tasks-changes-${Date.now()}-${Math.random()}`;
      this.channel = supabase.channel(channelName);
      
      this.channel
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload) => {
          console.log('useTasksRealtime: Tasks data changed via real-time:', payload);
          
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
            console.log('useTasksRealtime: Notifying all task subscribers of external change');
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
        })
        .subscribe((status) => {
          console.log('useTasksRealtime: Channel subscription status:', status);
          this.isInitializing = false;
        });
    } catch (error) {
      console.error('Error creating tasks channel:', error);
      this.isInitializing = false;
    }
  }

  unsubscribe(callback: () => void, updatingTasksRef: React.MutableRefObject<Set<string>>): void {
    this.subscribers.delete(callback);
    this.updatingTasksRefs.delete(updatingTasksRef);
    console.log('useTasksRealtime: Subscriber removed, remaining:', this.subscribers.size);

    if (this.subscribers.size === 0 && this.channel) {
      console.log('useTasksRealtime: Cleaning up tasks channel');
      try {
        supabase.removeChannel(this.channel);
      } catch (error) {
        console.log('useTasksRealtime: Error cleaning up channel:', error);
      }
      this.channel = null;
      this.isInitializing = false;
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
