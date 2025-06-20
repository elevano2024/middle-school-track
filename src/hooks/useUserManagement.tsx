
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Profile {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  user_roles?: { role: 'admin' | 'teacher' | 'student' }[];
}

export const useUserManagement = () => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfiles = async () => {
    if (!user) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        setError('Failed to fetch users');
        return;
      }

      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) {
        console.error('Error fetching roles:', rolesError);
      }

      const profilesWithRoles = profilesData?.map(profile => ({
        ...profile,
        user_roles: rolesData?.filter(role => role.user_id === profile.id).map(role => ({ role: role.role })) || []
      })) || [];

      setProfiles(profilesWithRoles);
    } catch (error) {
      console.error('Error in fetchProfiles:', error);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, [user]);

  const assignRole = async (userId: string, role: 'admin' | 'teacher' | 'student') => {
    if (!user) {
      toast.error('You must be logged in to assign roles');
      return false;
    }

    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: role,
          assigned_by: user.id
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('User already has this role');
        } else {
          console.error('Error assigning role:', error);
          toast.error('Failed to assign role');
        }
        return false;
      }

      toast.success('Role assigned successfully');
      await fetchProfiles();
      return true;
    } catch (error) {
      console.error('Error assigning role:', error);
      toast.error('Failed to assign role');
      return false;
    }
  };

  const resetUserPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/auth'
      });

      if (error) {
        console.error('Error sending reset email:', error);
        toast.error('Failed to send password reset email');
        return false;
      }

      toast.success('Password reset email sent successfully');
      return true;
    } catch (error) {
      console.error('Error sending reset email:', error);
      toast.error('Failed to send password reset email');
      return false;
    }
  };

  const createNewUser = async (email: string, password: string, fullName: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('You must be logged in to create users');
        return false;
      }

      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          email: email,
          password: password,
          fullName: fullName
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Error creating user:', error);
        toast.error(`Failed to create user: ${error.message}`);
        return false;
      }

      toast.success('User created successfully');
      await fetchProfiles();
      return true;
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Failed to create user');
      return false;
    }
  };

  return {
    profiles,
    loading,
    error,
    fetchProfiles,
    assignRole,
    resetUserPassword,
    createNewUser
  };
};
