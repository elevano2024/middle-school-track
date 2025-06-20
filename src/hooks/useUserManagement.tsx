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
      // Start a transaction-like approach
      console.log(`Assigning role "${role}" to user ${userId}`);

      // 1. First, assign the role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: role,
          assigned_by: user.id
        });

      if (roleError) {
        if (roleError.code === '23505') {
          toast.error('User already has this role');
        } else {
          console.error('Error assigning role:', roleError);
          toast.error('Failed to assign role');
        }
        return false;
      }

      // 2. If the role is "student", also create a student record
      if (role === 'student') {
        console.log('Creating student record for user:', userId);
        
        // Get the user's profile information
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', userId)
          .single();

        if (profileError) {
          console.error('Error fetching profile for student creation:', profileError);
          // Don't fail the entire operation, just log the issue
          toast.warning('Role assigned but failed to create student profile. Please contact an administrator.');
        } else {
          // Create the student record
          const { error: studentError } = await supabase
            .from('students')
            .upsert({
              id: userId, // Use the user ID as the student ID
              name: profileData.full_name || 'Unknown Name',
              grade: '7', // Default to grade 7 - can be updated later
            })
            .select();

          if (studentError) {
            console.error('Error creating/updating student record:', studentError);
            toast.warning('Role assigned but failed to create student profile. Please contact an administrator.');
          } else {
            console.log('Successfully created/updated student record for:', userId);
          }
        }
      }

      toast.success(`${role.charAt(0).toUpperCase() + role.slice(1)} role assigned successfully`);
      await fetchProfiles();
      return true;
    } catch (error) {
      console.error('Error in assignRole:', error);
      toast.error('Failed to assign role');
      return false;
    }
  };

  const removeRole = async (userId: string, role: 'admin' | 'teacher' | 'student') => {
    if (!user) {
      toast.error('You must be logged in to remove roles');
      return false;
    }

    try {
      console.log(`Removing role "${role}" from user ${userId}`);

      // 1. Remove the role
      const { error: roleError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role);

      if (roleError) {
        console.error('Error removing role:', roleError);
        toast.error('Failed to remove role');
        return false;
      }

      // 2. If the role is "student", also remove from students table
      if (role === 'student') {
        console.log('Removing student record for user:', userId);
        
        const { error: studentError } = await supabase
          .from('students')
          .delete()
          .eq('id', userId);

        if (studentError) {
          console.error('Error removing student record:', studentError);
          toast.warning('Role removed but failed to remove student profile. Please contact an administrator.');
        } else {
          console.log('Successfully removed student record for:', userId);
        }
      }

      toast.success(`${role.charAt(0).toUpperCase() + role.slice(1)} role removed successfully`);
      await fetchProfiles();
      return true;
    } catch (error) {
      console.error('Error in removeRole:', error);
      toast.error('Failed to remove role');
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

  const syncStudentRecords = async () => {
    if (!user) {
      toast.error('You must be logged in to sync student records');
      return false;
    }

    try {
      console.log('Starting student records synchronization...');
      
      // Get all users with student role
      const { data: studentRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'student');

      if (rolesError) {
        console.error('Error fetching student roles:', rolesError);
        toast.error('Failed to fetch student roles');
        return false;
      }

      if (!studentRoles || studentRoles.length === 0) {
        toast.info('No student roles found to sync');
        return true;
      }

      console.log(`Found ${studentRoles.length} users with student role`);

      // Get profiles for these users
      const userIds = studentRoles.map(role => role.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        toast.error('Failed to fetch user profiles');
        return false;
      }

      // Create student records for each user
      const studentRecords = profiles?.map(profile => ({
        id: profile.id,
        name: profile.full_name || 'Unknown Name',
        grade: '7' as const, // Default grade with proper typing
      })) || [];

      if (studentRecords.length > 0) {
        const { error: syncError } = await supabase
          .from('students')
          .upsert(studentRecords)
          .select();

        if (syncError) {
          console.error('Error syncing student records:', syncError);
          toast.error('Failed to sync student records');
          return false;
        }

        console.log(`Successfully synced ${studentRecords.length} student records`);
        toast.success(`Synchronized ${studentRecords.length} student records`);
      }

      await fetchProfiles();
      return true;
    } catch (error) {
      console.error('Error in syncStudentRecords:', error);
      toast.error('Failed to sync student records');
      return false;
    }
  };

  const deleteUser = async (userId: string) => {
    if (!user) {
      toast.error('You must be logged in to delete users');
      return false;
    }

    try {
      console.log(`Starting deletion process for user: ${userId}`);

      // Get user details for logging
      const userToDelete = profiles.find(p => p.id === userId);
      const userName = userToDelete?.full_name || 'Unknown User';
      const userEmail = userToDelete?.email || 'Unknown Email';

      console.log(`Deleting user: ${userName} (${userEmail})`);

      // 1. Delete from students table if exists
      const { error: studentError } = await supabase
        .from('students')
        .delete()
        .eq('id', userId);

      if (studentError && studentError.code !== 'PGRST116') { // PGRST116 is "no rows deleted" which is fine
        console.error('Error deleting student record:', studentError);
        // Don't fail the operation, just log it
      } else {
        console.log('Student record deleted (if existed)');
      }

      // 2. Delete all user roles
      const { error: rolesError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (rolesError && rolesError.code !== 'PGRST116') {
        console.error('Error deleting user roles:', rolesError);
        // Don't fail the operation, just log it
      } else {
        console.log('User roles deleted (if existed)');
      }

      // 3. Delete tasks assigned to this user (if they're a student)
      const { error: tasksError } = await supabase
        .from('tasks')
        .delete()
        .eq('student_id', userId);

      if (tasksError && tasksError.code !== 'PGRST116') {
        console.error('Error deleting user tasks:', tasksError);
        // Don't fail the operation, just log it
      } else {
        console.log('User tasks deleted (if existed)');
      }

      // 4. Delete attendance records
      const { error: attendanceError } = await supabase
        .from('attendance')
        .delete()
        .eq('student_id', userId);

      if (attendanceError && attendanceError.code !== 'PGRST116') {
        console.error('Error deleting attendance records:', attendanceError);
        // Don't fail the operation, just log it
      } else {
        console.log('Attendance records deleted (if existed)');
      }

      // 5. Finally, delete the user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileError) {
        console.error('Error deleting user profile:', profileError);
        toast.error('Failed to delete user profile');
        return false;
      }

      console.log('User profile deleted successfully');

      // 6. Delete the auth user (this should be done via admin API in production)
      // Note: This requires admin privileges and should ideally be done server-side
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          const { error: authError } = await supabase.functions.invoke('delete-user', {
            body: { userId: userId },
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          });

          if (authError) {
            console.error('Error deleting auth user:', authError);
            toast.warning('User data deleted but auth account may still exist. Contact system administrator.');
          } else {
            console.log('Auth user deleted successfully');
          }
        }
      } catch (authError) {
        console.error('Error with auth deletion:', authError);
        toast.warning('User data deleted but auth account may still exist. Contact system administrator.');
      }

      toast.success(`User ${userName} has been completely deleted from the system`);
      await fetchProfiles();
      return true;
    } catch (error) {
      console.error('Error in deleteUser:', error);
      toast.error('Failed to delete user');
      return false;
    }
  };

  return {
    profiles,
    loading,
    error,
    fetchProfiles,
    assignRole,
    removeRole,
    resetUserPassword,
    createNewUser,
    syncStudentRecords,
    deleteUser
  };
};
