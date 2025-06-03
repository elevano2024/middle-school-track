
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Subject {
  id: string;
  name: string;
  created_at: string;
}

// Global channel manager that ensures only one subscription per channel
class SubjectsChannelManager {
  private static instance: SubjectsChannelManager;
  private channel: any = null;
  private subscribers: Set<() => void> = new Set();
  private isSubscribed = false;
  private isSubscribing = false;

  static getInstance(): SubjectsChannelManager {
    if (!SubjectsChannelManager.instance) {
      SubjectsChannelManager.instance = new SubjectsChannelManager();
    }
    return SubjectsChannelManager.instance;
  }

  async subscribe(callback: () => void): Promise<void> {
    this.subscribers.add(callback);
    console.log('useSubjects: Added subscriber, total:', this.subscribers.size);

    // If already subscribed, nothing more to do
    if (this.isSubscribed) {
      console.log('useSubjects: Already subscribed, using existing channel');
      return;
    }

    // If currently subscribing, wait for it to complete
    if (this.isSubscribing) {
      console.log('useSubjects: Subscription in progress, waiting...');
      while (this.isSubscribing) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      return;
    }

    // Start subscribing
    this.isSubscribing = true;
    console.log('useSubjects: Creating and subscribing to new subjects channel');

    try {
      // Create a unique channel name
      const channelName = `subjects-changes-${Date.now()}-${Math.random()}`;
      this.channel = supabase.channel(channelName);
      
      // Set up the channel with event handlers
      this.channel.on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'subjects' 
      }, (payload) => {
        console.log('useSubjects: Database change detected, notifying subscribers...', payload);
        this.subscribers.forEach(callback => {
          try {
            callback();
          } catch (error) {
            console.error('Error calling subjects callback:', error);
          }
        });
      });

      // Subscribe to the channel (this should only happen once per channel instance)
      await new Promise<void>((resolve, reject) => {
        this.channel.subscribe((status) => {
          console.log('useSubjects: Channel subscription status:', status);
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
      console.error('Error creating subjects channel:', error);
      this.isSubscribing = false;
      this.isSubscribed = false;
    }
  }

  unsubscribe(callback: () => void): void {
    this.subscribers.delete(callback);
    console.log('useSubjects: Removed subscriber, remaining:', this.subscribers.size);

    // If no more subscribers, cleanup the channel
    if (this.subscribers.size === 0 && this.channel) {
      console.log('useSubjects: No more subscribers, cleaning up channel');
      try {
        supabase.removeChannel(this.channel);
      } catch (error) {
        console.log('useSubjects: Error cleaning up channel:', error);
      }
      this.channel = null;
      this.isSubscribed = false;
      this.isSubscribing = false;
    }
  }
}

export const useSubjects = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const callbackRef = useRef<() => void>();

  const fetchSubjects = async () => {
    try {
      console.log('useSubjects: Fetching subjects...');
      setLoading(true);
      
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .order('name');

      if (error) {
        console.error('useSubjects: Error fetching subjects:', error);
        setSubjects([]);
      } else {
        console.log('useSubjects: Successfully fetched subjects:', data);
        setSubjects(data || []);
      }
    } catch (error) {
      console.error('useSubjects: Error fetching subjects:', error);
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  };

  // Store the fetchSubjects function in a ref
  callbackRef.current = fetchSubjects;

  useEffect(() => {
    // Initial fetch
    console.log('useSubjects: Initial fetch triggered');
    fetchSubjects();
  }, []);

  // Set up real-time subscription
  useEffect(() => {
    if (!callbackRef.current) return;

    const manager = SubjectsChannelManager.getInstance();
    const callback = callbackRef.current;

    manager.subscribe(callback);

    return () => {
      manager.unsubscribe(callback);
    };
  }, []);

  return { subjects, loading, refetch: fetchSubjects };
};
