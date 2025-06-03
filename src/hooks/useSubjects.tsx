
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
  private subscriptionPromise: Promise<void> | null = null;

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

    // If currently subscribing, wait for the existing subscription to complete
    if (this.isSubscribing && this.subscriptionPromise) {
      console.log('useSubjects: Subscription in progress, waiting...');
      await this.subscriptionPromise;
      return;
    }

    // Start subscribing
    this.isSubscribing = true;
    console.log('useSubjects: Creating and subscribing to new subjects channel');

    // Create the subscription promise
    this.subscriptionPromise = this.createSubscription();
    
    try {
      await this.subscriptionPromise;
    } catch (error) {
      console.error('Error in subscription:', error);
      this.isSubscribing = false;
      this.isSubscribed = false;
      this.subscriptionPromise = null;
    }
  }

  private async createSubscription(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
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
        this.channel.subscribe((status) => {
          console.log('useSubjects: Channel subscription status:', status);
          if (status === 'SUBSCRIBED') {
            this.isSubscribed = true;
            this.isSubscribing = false;
            this.subscriptionPromise = null;
            resolve();
          } else if (status === 'CHANNEL_ERROR') {
            this.isSubscribing = false;
            this.subscriptionPromise = null;
            reject(new Error('Channel subscription failed'));
          }
          // Note: We don't handle 'CLOSED' here as it's handled in unsubscribe
        });
      } catch (error) {
        this.isSubscribing = false;
        this.subscriptionPromise = null;
        reject(error);
      }
    });
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
      this.subscriptionPromise = null;
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
