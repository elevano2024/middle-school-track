
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'admin' | 'teacher' | 'student';

export const useUserRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        console.log('No user found, setting role to null');
        setRole(null);
        setError(null);
        setLoading(false);
        return;
      }

      try {
        console.log('Fetching role for user:', user.id, user.email);
        setLoading(true);
        
        const { data, error: fetchError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (fetchError) {
          if (fetchError.code === 'PGRST116') {
            console.log('No role found for user:', user.email);
            setRole(null);
            setError('No role assigned');
          } else {
            console.error('Error fetching user role:', fetchError);
            setError('Failed to fetch user role');
          }
        } else if (data) {
          console.log('Role found for user:', user.email, 'Role:', data.role);
          setRole(data.role as UserRole);
          setError(null);
        }
      } catch (error) {
        console.error('Unexpected error fetching user role:', error);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user]);

  const isAdmin = role === 'admin';
  const isTeacher = role === 'teacher';
  const isStudent = role === 'student';

  console.log('useUserRole state:', { role, loading, error, isAdmin, isTeacher, isStudent, userEmail: user?.email });

  return { role, loading, error, isAdmin, isTeacher, isStudent };
};
