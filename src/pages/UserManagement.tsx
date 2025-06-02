import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface Profile {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  user_roles?: { role: 'admin' | 'teacher' | 'student' }[];
}

const UserManagement = () => {
  const { user } = useAuth();
  const { isAdmin, isTeacher } = useUserRole();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState<'admin' | 'teacher' | 'student' | ''>('');
  const [resetPasswordEmail, setResetPasswordEmail] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserFullName, setNewUserFullName] = useState('');
  const [creatingUser, setCreatingUser] = useState(false);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const { data: profilesData, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching profiles:', error);
        toast.error('Failed to fetch users');
        return;
      }

      // Fetch user roles separately
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) {
        console.error('Error fetching roles:', rolesError);
      }

      // Combine profiles with their roles
      const profilesWithRoles = profilesData?.map(profile => ({
        ...profile,
        user_roles: rolesData?.filter(role => role.user_id === profile.id).map(role => ({ role: role.role })) || []
      })) || [];

      setProfiles(profilesWithRoles);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const assignRole = async () => {
    if (!selectedUserId || !selectedRole) {
      toast.error('Please select a user and role');
      return;
    }

    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: selectedUserId,
          role: selectedRole,
          assigned_by: user?.id
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('User already has this role');
        } else {
          console.error('Error assigning role:', error);
          toast.error('Failed to assign role');
        }
      } else {
        toast.success('Role assigned successfully');
        setSelectedUserId('');
        setSelectedRole('');
        fetchProfiles();
      }
    } catch (error) {
      console.error('Error assigning role:', error);
      toast.error('Failed to assign role');
    }
  };

  const resetUserPassword = async () => {
    if (!resetPasswordEmail) {
      toast.error('Please enter an email address');
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetPasswordEmail, {
        redirectTo: window.location.origin + '/auth'
      });

      if (error) {
        console.error('Error sending reset email:', error);
        toast.error('Failed to send password reset email');
      } else {
        toast.success('Password reset email sent successfully');
        setResetPasswordEmail('');
      }
    } catch (error) {
      console.error('Error sending reset email:', error);
      toast.error('Failed to send password reset email');
    }
  };

  const createNewUser = async () => {
    if (!newUserEmail || !newUserPassword || !newUserFullName) {
      toast.error('Please fill in all fields');
      return;
    }

    if (newUserPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setCreatingUser(true);

    try {
      // Get the current session to pass the auth token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('You must be logged in to create users');
        return;
      }

      // Call the Edge Function instead of using admin API directly
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          email: newUserEmail,
          password: newUserPassword,
          fullName: newUserFullName
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Error creating user:', error);
        toast.error(`Failed to create user: ${error.message}`);
      } else {
        toast.success('User created successfully');
        setNewUserEmail('');
        setNewUserPassword('');
        setNewUserFullName('');
        fetchProfiles();
      }
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Failed to create user');
    } finally {
      setCreatingUser(false);
    }
  };

  if (!isAdmin && !isTeacher) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <p>You don't have permission to access user management.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <p>Loading users...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">User Management</h1>
      </div>

      {isAdmin && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Create New User</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Input
                    type="text"
                    placeholder="Full Name"
                    value={newUserFullName}
                    onChange={(e) => setNewUserFullName(e.target.value)}
                  />
                </div>
                <div>
                  <Input
                    type="email"
                    placeholder="Email Address"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                  />
                </div>
                <div>
                  <Input
                    type="password"
                    placeholder="Password (min 6 chars)"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={createNewUser} 
                    className="w-full"
                    disabled={creatingUser}
                  >
                    {creatingUser ? 'Creating...' : 'Create User'}
                  </Button>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Create a new user account with email and password. The user will be able to log in immediately.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Assign Role</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a user" />
                    </SelectTrigger>
                    <SelectContent>
                      {profiles.map((profile) => (
                        <SelectItem key={profile.id} value={profile.id}>
                          {profile.full_name} ({profile.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Select value={selectedRole} onValueChange={(value: 'admin' | 'teacher' | 'student') => setSelectedRole(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="teacher">Teacher</SelectItem>
                      <SelectItem value="student">Student</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={assignRole} className="w-full">
                    Assign Role
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reset User Password</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Input
                  type="email"
                  placeholder="Enter user email"
                  value={resetPasswordEmail}
                  onChange={(e) => setResetPasswordEmail(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={resetUserPassword}>
                  Send Reset Email
                </Button>
              </div>
              <p className="text-sm text-gray-600">
                This will send a password reset email to the user. They can use it to set a new password.
              </p>
            </CardContent>
          </Card>
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {profiles.map((profile) => (
              <div key={profile.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">{profile.full_name}</h3>
                  <p className="text-sm text-muted-foreground">{profile.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Joined: {new Date(profile.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  {profile.user_roles && profile.user_roles.length > 0 ? (
                    profile.user_roles.map((userRole, index) => (
                      <Badge key={index} variant="secondary">
                        {userRole.role}
                      </Badge>
                    ))
                  ) : (
                    <Badge variant="outline">No role assigned</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;
