import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'admin' | 'teacher' | 'student';

export const useUserRole = () => {
  const { user } = useAuth();

  const {
    data: role,
    isLoading: loading,
    error
  } = useQuery({
    queryKey: ['userRole', user?.id],
    queryFn: async (): Promise<UserRole | null> => {
      if (!user?.id) {
        return null;
      }

      console.log('Fetching role for user:', user.id, user.email);
      
      const { data, error: fetchError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          console.log('No role found for user:', user.email);
          return null; // No role assigned
        } else {
          console.error('Error fetching user role:', fetchError);
          throw new Error('Failed to fetch user role');
        }
      }

      if (data) {
        console.log('Role found for user:', user.email, 'Role:', data.role);
        return data.role as UserRole;
      }

      return null;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    gcTime: 1000 * 60 * 10, // Keep in garbage collection for 10 minutes
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // Don't retry on "no role found" errors
      if (error?.message?.includes('Failed to fetch user role')) {
        return failureCount < 2;
      }
      return false;
    }
  });

  const isAdmin = role === 'admin';
  const isTeacher = role === 'teacher';
  const isStudent = role === 'student';

  // Only log when role actually changes
  const errorMessage = error instanceof Error ? error.message : null;

  return { 
    role, 
    loading, 
    error: errorMessage, 
    isAdmin, 
    isTeacher, 
    isStudent 
  };
};
