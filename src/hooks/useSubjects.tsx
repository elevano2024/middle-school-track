
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Subject {
  id: string;
  name: string;
  created_at: string;
}

// Singleton channel manager to prevent multiple subscriptions
class SubjectsChannelManager {
  private static instance: SubjectsChannelManager;
  private channel: any = null;
  private subscribers: Set<() => void> = new Set();
  private isInitializing = false;

  static getInstance(): SubjectsChannelManager {
    if (!SubjectsChannelManager.instance) {
      SubjectsChannelManager.instance = new SubjectsChannelManager();
    }
    return SubjectsChannelManager.instance;
  }

  async subscribe(callback: () => void): Promise<void> {
    this.subscribers.add(callback);

    if (this.channel) {
      console.log('useSubjects: Using existing channel');
      return;
    }

    if (this.isInitializing) {
      console.log('useSubjects: Channel initialization in progress, waiting...');
      // Wait for initialization to complete
      while (this.isInitializing) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      return;
    }

    this.isInitializing = true;
    console.log('useSubjects: Creating new subjects channel');

    try {
      const channelName = `subjects-changes-${Date.now()}-${Math.random()}`;
      this.channel = supabase.channel(channelName);
      
      this.channel
        .on('postgres_changes', { event: '*', schema: 'public', table: 'subjects' }, (payload) => {
          console.log('useSubjects: Subjects data changed, notifying all subscribers...', payload);
          this.subscribers.forEach(callback => {
            try {
              callback();
            } catch (error) {
              console.error('Error calling subjects callback:', error);
            }
          });
        })
        .subscribe((status) => {
          console.log('useSubjects: Channel subscription status:', status);
          this.isInitializing = false;
        });
    } catch (error) {
      console.error('Error creating subjects channel:', error);
      this.isInitializing = false;
    }
  }

  unsubscribe(callback: () => void): void {
    this.subscribers.delete(callback);
    console.log('useSubjects: Subscriber removed, remaining:', this.subscribers.size);

    if (this.subscribers.size === 0 && this.channel) {
      console.log('useSubjects: Cleaning up subjects channel');
      try {
        supabase.removeChannel(this.channel);
      } catch (error) {
        console.log('useSubjects: Error cleaning up channel:', error);
      }
      this.channel = null;
      this.isInitializing = false;
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

  // Store the fetchSubjects function in a ref so it can be called by real-time updates
  callbackRef.current = fetchSubjects;

  useEffect(() => {
    // Always fetch subjects immediately
    console.log('useSubjects: Initial fetch triggered');
    fetchSubjects();
  }, []);

  // Set up real-time subscription using singleton manager
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
