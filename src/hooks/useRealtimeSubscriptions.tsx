import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

// Global subscription state - better management
class SubscriptionManager {
  private static instance: SubscriptionManager;
  private channel: any = null;
  private isSubscribed = false;
  private userId: string | null = null;
  private isCleaningUp = false; // Prevent recursive cleanup

  static getInstance(): SubscriptionManager {
    if (!SubscriptionManager.instance) {
      SubscriptionManager.instance = new SubscriptionManager();
    }
    return SubscriptionManager.instance;
  }

  isActive(userId: string): boolean {
    return this.isSubscribed && this.userId === userId && this.channel !== null && !this.isCleaningUp;
  }

  async subscribe(userId: string, queryClient: any): Promise<boolean> {
    if (this.isActive(userId)) {
      console.log('Real-time subscriptions already active for user:', userId);
      return true;
    }

    // Clean up any existing subscriptions first (but not recursively)
    if (!this.isCleaningUp) {
      this.cleanup();
    }

    console.log('=== INITIALIZING REAL-TIME SUBSCRIPTIONS ===');
    console.log('User ID:', userId);
    
    try {
      // Create a single channel for all real-time updates
      const channelName = `app-realtime-${userId}`;
      this.channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'tasks'
          },
          (payload) => {
            console.log('=== REAL-TIME TASK CHANGE ===', payload.eventType);
            // Use a timeout to batch invalidations and prevent excessive DB calls
            setTimeout(() => {
              queryClient.invalidateQueries({ queryKey: ['tasks'] });
            }, 100);
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'subjects'
          },
          (payload) => {
            console.log('=== REAL-TIME SUBJECT CHANGE ===', payload.eventType);
            setTimeout(() => {
              queryClient.invalidateQueries({ queryKey: ['subjects'] });
            }, 100);
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'attendance'
          },
          (payload) => {
            console.log('=== REAL-TIME ATTENDANCE CHANGE ===', payload.eventType);
            setTimeout(() => {
              queryClient.invalidateQueries({ queryKey: ['attendance'] });
            }, 100);
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'students'
          },
          (payload) => {
            console.log('=== REAL-TIME STUDENTS CHANGE ===', payload.eventType);
            setTimeout(() => {
              queryClient.invalidateQueries({ queryKey: ['students'] });
            }, 100);
          }
        );

      // Subscribe and wait for confirmation
      return new Promise((resolve) => {
        this.channel.subscribe((status: string) => {
          console.log('=== SUBSCRIPTION STATUS ===', status);
          
          if (status === 'SUBSCRIBED') {
            this.isSubscribed = true;
            this.userId = userId;
            console.log('✅ Real-time subscriptions active');
            resolve(true);
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.error('❌ Real-time subscription error:', status);
            // Don't call cleanup here to prevent recursion
            this.isSubscribed = false;
            this.userId = null;
            resolve(false);
          } else if (status === 'CLOSED') {
            console.log('📤 Real-time subscription closed');
            // Don't call cleanup here to prevent recursion
            this.isSubscribed = false;
            this.userId = null;
            resolve(false);
          }
        });
      });
    } catch (error) {
      console.error('Error setting up real-time subscriptions:', error);
      // Don't call cleanup here to prevent recursion
      this.isSubscribed = false;
      this.userId = null;
      return false;
    }
  }

  cleanup(): void {
    if (this.isCleaningUp) {
      console.log('Cleanup already in progress, skipping...');
      return;
    }

    this.isCleaningUp = true;
    
    if (this.channel) {
      console.log('=== CLEANING UP REAL-TIME SUBSCRIPTIONS ===');
      try {
        supabase.removeChannel(this.channel);
      } catch (error) {
        console.error('Error removing channel:', error);
      }
      this.channel = null;
    }
    
    this.isSubscribed = false;
    this.userId = null;
    this.isCleaningUp = false;
  }
}

export const useRealtimeSubscriptions = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const subscriptionManager = SubscriptionManager.getInstance();
  const hasInitialized = useRef(false);
  const isInitializing = useRef(false);

  useEffect(() => {
    if (!user?.id) {
      // User logged out, cleanup
      if (hasInitialized.current) {
        subscriptionManager.cleanup();
        hasInitialized.current = false;
        isInitializing.current = false;
      }
      return;
    }

    // Prevent duplicate initialization
    if (hasInitialized.current && subscriptionManager.isActive(user.id)) {
      return;
    }

    // Prevent multiple concurrent initializations
    if (isInitializing.current) {
      return;
    }

    // Initialize subscriptions
    const initializeSubscriptions = async () => {
      isInitializing.current = true;
      try {
        const success = await subscriptionManager.subscribe(user.id, queryClient);
        if (success) {
          hasInitialized.current = true;
        }
      } catch (error) {
        console.error('Failed to initialize subscriptions:', error);
      } finally {
        isInitializing.current = false;
      }
    };

    initializeSubscriptions();

    // Cleanup on unmount
    return () => {
      if (hasInitialized.current && !isInitializing.current) {
        subscriptionManager.cleanup();
        hasInitialized.current = false;
      }
    };
  }, [queryClient, user?.id]);

  return null;
};
