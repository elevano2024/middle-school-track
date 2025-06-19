
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

// Global flag to prevent multiple initializations across the entire app
let globalInitialized = false;
let globalChannel: any = null;

export const useRealtimeSubscriptions = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isInitializedRef = useRef(false);

  useEffect(() => {
    // Only initialize if user is authenticated and we haven't initialized globally
    if (!user || globalInitialized || isInitializedRef.current) {
      return;
    }

    console.log('=== INITIALIZING REAL-TIME SUBSCRIPTIONS ===');
    
    // Create a single channel for all real-time updates with a unique name
    const channelName = `database-changes-${user.id}-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks'
        },
        (payload) => {
          console.log('=== REAL-TIME TASK CHANGE DETECTED ===');
          console.log('Payload:', payload);
          queryClient.invalidateQueries({ queryKey: ['tasks'] });
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
          console.log('=== REAL-TIME SUBJECT CHANGE DETECTED ===');
          console.log('Payload:', payload);
          queryClient.invalidateQueries({ queryKey: ['subjects'] });
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
          console.log('=== REAL-TIME ATTENDANCE CHANGE DETECTED ===');
          console.log('Payload:', payload);
          queryClient.invalidateQueries({ queryKey: ['attendance'] });
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
          console.log('=== REAL-TIME STUDENTS CHANGE DETECTED ===');
          console.log('Payload:', payload);
          queryClient.invalidateQueries({ queryKey: ['students'] });
        }
      );

    // Subscribe to the channel
    channel.subscribe((status) => {
      console.log('=== REAL-TIME SUBSCRIPTION STATUS ===');
      console.log('Status:', status);
      if (status === 'SUBSCRIBED') {
        globalInitialized = true;
        isInitializedRef.current = true;
        globalChannel = channel;
      }
    });

    // Cleanup function
    return () => {
      console.log('=== CLEANING UP REAL-TIME SUBSCRIPTIONS ===');
      if (globalChannel) {
        supabase.removeChannel(globalChannel);
        globalChannel = null;
      }
      globalInitialized = false;
      isInitializedRef.current = false;
    };
  }, [queryClient, user]);

  // Clean up on user logout
  useEffect(() => {
    if (!user && globalChannel) {
      console.log('=== USER LOGGED OUT - CLEANING UP SUBSCRIPTIONS ===');
      supabase.removeChannel(globalChannel);
      globalChannel = null;
      globalInitialized = false;
      isInitializedRef.current = false;
    }
  }, [user]);

  return null;
};
