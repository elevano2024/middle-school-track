import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// Global subscription state - better management
class SubscriptionManager {
  private static instance: SubscriptionManager;
  private channel: any = null;
  private isSubscribed = false;
  private userId: string | null = null;
  private isCleaningUp = false;
  private retryCount = 0;
  private maxRetries = 3;

  static getInstance(): SubscriptionManager {
    if (!SubscriptionManager.instance) {
      SubscriptionManager.instance = new SubscriptionManager();
    }
    return SubscriptionManager.instance;
  }

  isActive(userId: string): boolean {
    return this.isSubscribed && this.userId === userId && this.channel !== null && !this.isCleaningUp;
  }

  async subscribe(userId: string, queryClient: any, toast?: any): Promise<boolean> {
    if (this.isActive(userId)) {
      console.log('Real-time subscriptions already active for user:', userId);
      return true;
    }

    // Clean up any existing subscriptions first
    if (!this.isCleaningUp) {
      this.cleanup();
    }

    console.log('=== INITIALIZING REAL-TIME SUBSCRIPTIONS ===');
    console.log('User ID:', userId);
    console.log('Retry attempt:', this.retryCount + 1);
    
    try {
      // Create a single channel for all real-time updates
      const channelName = `app-realtime-${userId}-${Date.now()}`;
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
            console.log('=== REAL-TIME TASK CHANGE ===', payload.eventType, payload);
            
            // Aggressive cache invalidation for production
            queryClient.invalidateQueries({ 
              queryKey: ['tasks'],
              exact: false,
              refetchType: 'active' // Only refetch active queries
            });
            
            // Also invalidate any related queries
            queryClient.invalidateQueries({ 
              queryKey: ['students'],
              exact: false,
              refetchType: 'active'
            });
            
            // Force immediate refetch for tasks
            queryClient.refetchQueries({ 
              queryKey: ['tasks'],
              exact: false
            });
            
            // Show toast notification for status changes
            if (payload.eventType === 'UPDATE' && payload.new && payload.old && toast) {
              const taskTitle = payload.new.title || 'Task';
              const oldStatus = payload.old.status;
              const newStatus = payload.new.status;
              
              if (oldStatus !== newStatus) {
                console.log(`Task "${taskTitle}" status changed: ${oldStatus} → ${newStatus}`);
                
                toast({
                  title: "Real-time Update",
                  description: `"${taskTitle}" changed to ${newStatus.replace('-', ' ')}`,
                  duration: 2000,
                });
              }
            }
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
            queryClient.invalidateQueries({ 
              queryKey: ['subjects'],
              exact: false,
              refetchType: 'active'
            });
            queryClient.refetchQueries({ 
              queryKey: ['subjects'],
              exact: false
            });
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
            queryClient.invalidateQueries({ 
              queryKey: ['attendance'],
              exact: false,
              refetchType: 'active'
            });
            queryClient.refetchQueries({ 
              queryKey: ['attendance'],
              exact: false
            });
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
            queryClient.invalidateQueries({ 
              queryKey: ['students'],
              exact: false,
              refetchType: 'active'
            });
            queryClient.refetchQueries({ 
              queryKey: ['students'],
              exact: false
            });
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_roles'
          },
          (payload) => {
            console.log('=== REAL-TIME USER ROLES CHANGE ===', payload.eventType);
            queryClient.invalidateQueries({ 
              queryKey: ['userRole'],
              exact: false,
              refetchType: 'active'
            });
            queryClient.refetchQueries({ 
              queryKey: ['userRole'],
              exact: false
            });
          }
        );

      // Subscribe and wait for confirmation with timeout
      return new Promise((resolve) => {
        const timeoutId = setTimeout(() => {
          console.error('❌ Real-time subscription timeout');
          this.handleSubscriptionError(queryClient, toast);
          resolve(false);
        }, 10000); // 10 second timeout

        this.channel.subscribe((status: string) => {
          console.log('=== SUBSCRIPTION STATUS ===', status);
          
          if (status === 'SUBSCRIBED') {
            clearTimeout(timeoutId);
            this.isSubscribed = true;
            this.userId = userId;
            this.retryCount = 0; // Reset retry count on success
            console.log('✅ Real-time subscriptions active for all tables');
            resolve(true);
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            clearTimeout(timeoutId);
            console.error('❌ Real-time subscription error:', status);
            this.handleSubscriptionError(queryClient, toast);
            resolve(false);
          } else if (status === 'CLOSED') {
            clearTimeout(timeoutId);
            console.log('📤 Real-time subscription closed');
            this.isSubscribed = false;
            this.userId = null;
            resolve(false);
          }
        });
      });
    } catch (error) {
      console.error('Error setting up real-time subscriptions:', error);
      this.handleSubscriptionError(queryClient, toast);
      return false;
    }
  }

  private handleSubscriptionError(queryClient: any, toast?: any) {
    this.isSubscribed = false;
    this.userId = null;
    
    // Fallback: More frequent polling for production reliability
    console.log('🔄 Enabling fallback polling for production reliability');
    
    // Set shorter stale times and enable background refetching
    queryClient.setQueryDefaults(['tasks'], {
      staleTime: 1000 * 30, // 30 seconds
      refetchInterval: 1000 * 60, // 1 minute
      refetchIntervalInBackground: true,
    });
    
    queryClient.setQueryDefaults(['students'], {
      staleTime: 1000 * 30,
      refetchInterval: 1000 * 60,
      refetchIntervalInBackground: true,
    });
    
    queryClient.setQueryDefaults(['attendance'], {
      staleTime: 1000 * 30,
      refetchInterval: 1000 * 60,
      refetchIntervalInBackground: true,
    });

    // Retry subscription if under max retries
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      console.log(`🔄 Retrying real-time subscription (${this.retryCount}/${this.maxRetries})`);
      
      setTimeout(() => {
        if (this.userId) {
          this.subscribe(this.userId, queryClient, toast);
        }
      }, 2000 * this.retryCount); // Exponential backoff
    } else {
      console.error('❌ Max retries reached for real-time subscriptions');
      if (toast) {
        toast({
          title: "Connection Issue",
          description: "Real-time updates may be delayed. The display will poll for updates.",
          duration: 5000,
        });
      }
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
    this.retryCount = 0;
    this.isCleaningUp = false;
  }
}

export const useRealtimeSubscriptions = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();
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
        const success = await subscriptionManager.subscribe(user.id, queryClient, toast);
        if (success) {
          hasInitialized.current = true;
          console.log('🎯 Real-time subscriptions ready for production TV display');
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
  }, [queryClient, user?.id, toast]);

  return null;
};
