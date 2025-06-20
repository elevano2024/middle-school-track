import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { AlertTriangle, Search, Users, UserPlus, UserMinus, MoreVertical, Mail, Trash2 } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface Profile {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  user_roles?: { role: 'admin' | 'teacher' | 'student' }[];
}

interface UsersListProps {
  profiles: Profile[];
  loading: boolean;
  error: string | null;
  onAssignRole?: (userId: string, role: 'admin' | 'teacher' | 'student') => Promise<boolean>;
  onRemoveRole?: (userId: string, role: 'admin' | 'teacher' | 'student') => Promise<boolean>;
  onResetPassword?: (email: string) => Promise<boolean>;
  onDeleteUser?: (userId: string) => Promise<boolean>;
}

export const UsersList: React.FC<UsersListProps> = ({ 
  profiles, 
  loading, 
  error,
  onAssignRole,
  onRemoveRole,
  onResetPassword,
  onDeleteUser
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'teacher' | 'student' | 'no-role'>('all');
  const [processingUserId, setProcessingUserId] = useState<string | null>(null);
  const { isAdmin } = useUserRole();
  const { user } = useAuth();
  const { toast } = useToast();

  // Filter users based on search and role filter
  const filteredProfiles = useMemo(() => {
    return profiles.filter(profile => {
      // Search filter
      const matchesSearch = !searchTerm || 
        profile.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.email.toLowerCase().includes(searchTerm.toLowerCase());

      // Role filter
      const userRoles = profile.user_roles?.map(ur => ur.role) || [];
      const matchesRole = roleFilter === 'all' || 
        (roleFilter === 'no-role' && userRoles.length === 0) ||
        (roleFilter !== 'no-role' && userRoles.includes(roleFilter as 'admin' | 'teacher' | 'student'));

      return matchesSearch && matchesRole;
    });
  }, [profiles, searchTerm, roleFilter]);

  // Handle role assignment
  const handleAssignRole = async (userId: string, role: 'admin' | 'teacher' | 'student') => {
    if (!onAssignRole || processingUserId) return;
    
    setProcessingUserId(userId);
    try {
      const success = await onAssignRole(userId, role);
      if (success) {
        toast({
          title: "Role Assigned",
          description: `Successfully assigned ${role} role.`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to assign role.",
        variant: "destructive",
      });
    } finally {
      setProcessingUserId(null);
    }
  };

  // Handle role removal
  const handleRemoveRole = async (userId: string, role: 'admin' | 'teacher' | 'student') => {
    if (!onRemoveRole || processingUserId) return;

    const profile = profiles.find(p => p.id === userId);
    if (!confirm(`Remove ${role} role from ${profile?.full_name}?`)) return;
    
    setProcessingUserId(userId);
    try {
      const success = await onRemoveRole(userId, role);
      if (success) {
        toast({
          title: "Role Removed",
          description: `Successfully removed ${role} role.`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove role.",
        variant: "destructive",
      });
    } finally {
      setProcessingUserId(null);
    }
  };

  // Handle password reset
  const handlePasswordReset = async (email: string) => {
    if (!onResetPassword || processingUserId) return;

    if (!confirm(`Send password reset email to ${email}?`)) return;
    
    setProcessingUserId('password-reset');
    try {
      const success = await onResetPassword(email);
      if (success) {
        toast({
          title: "Reset Email Sent",
          description: `Password reset email sent to ${email}.`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send reset email.",
        variant: "destructive",
      });
    } finally {
      setProcessingUserId(null);
    }
  };

  // Handle user deletion
  const handleDeleteUser = async (userId: string, userName: string, userEmail: string) => {
    if (!onDeleteUser || processingUserId) return;

    // Prevent self-deletion
    if (user?.id === userId) {
      toast({
        title: "Cannot Delete Own Account",
        description: "You cannot delete your own user account.",
        variant: "destructive",
      });
      return;
    }

    // Get user roles for additional warning
    const profile = profiles.find(p => p.id === userId);
    const userRoles = profile?.user_roles?.map(r => r.role) || [];
    const hasAdminRole = userRoles.includes('admin');

    // Create detailed confirmation message
    let confirmMessage = `⚠️ PERMANENT DELETION WARNING ⚠️\n\n`;
    confirmMessage += `This will PERMANENTLY DELETE the user account for:\n`;
    confirmMessage += `Name: ${userName}\n`;
    confirmMessage += `Email: ${userEmail}\n`;
    
    if (userRoles.length > 0) {
      confirmMessage += `Roles: ${userRoles.join(', ')}\n`;
    }
    
    confirmMessage += `\nThis action will delete:\n`;
    confirmMessage += `• User profile and authentication\n`;
    confirmMessage += `• All assigned roles\n`;
    confirmMessage += `• Student records (if applicable)\n`;
    confirmMessage += `• All tasks and assignments\n`;
    confirmMessage += `• All attendance records\n`;
    confirmMessage += `• Any other associated data\n\n`;
    
    if (hasAdminRole) {
      confirmMessage += `⚠️ WARNING: This user has ADMIN privileges!\n\n`;
    }
    
    confirmMessage += `This action CANNOT be undone!\n\n`;
    confirmMessage += `Type "${userName}" to confirm deletion:`;

    const userInput = prompt(confirmMessage);
    
    if (userInput !== userName) {
      if (userInput !== null) { // null means cancelled
        toast({
          title: "Deletion Cancelled",
          description: "User name confirmation did not match. Deletion cancelled for safety.",
          variant: "destructive",
        });
      }
      return;
    }

    setProcessingUserId(userId);
    try {
      const success = await onDeleteUser(userId);
      if (success) {
        toast({
          title: "User Deleted",
          description: `Successfully deleted user account for ${userName}.`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete user. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessingUserId(null);
    }
  };

  // Get role badge variant
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'teacher': return 'default';
      case 'student': return 'secondary';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingSpinner text="Loading users..." />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Users ({filteredProfiles.length})
          {filteredProfiles.length !== profiles.length && (
            <span className="text-sm font-normal text-gray-500">
              of {profiles.length} total
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Role Filter */}
          <Select value={roleFilter} onValueChange={(value: typeof roleFilter) => setRoleFilter(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admin Only</SelectItem>
              <SelectItem value="teacher">Teacher Only</SelectItem>
              <SelectItem value="student">Student Only</SelectItem>
              <SelectItem value="no-role">No Role Assigned</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Users Table */}
        {filteredProfiles.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {profiles.length === 0 ? (
              "No users found in the system."
            ) : (
              "No users match the selected filters. Try adjusting your search criteria."
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProfiles.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell className="font-medium">
                      {profile.full_name || 'No Name'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        {profile.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {profile.user_roles && profile.user_roles.length > 0 ? (
                          profile.user_roles.map((userRole, index) => (
                            <Badge 
                              key={index} 
                              variant={getRoleBadgeVariant(userRole.role)}
                              className="text-xs"
                            >
                              {userRole.role}
                            </Badge>
                          ))
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            No role assigned
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(profile.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            disabled={processingUserId === profile.id}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {/* Assign Roles */}
                          {isAdmin && onAssignRole && (
                            <>
                              <DropdownMenuItem 
                                onClick={() => handleAssignRole(profile.id, 'admin')}
                                disabled={profile.user_roles?.some(r => r.role === 'admin')}
                              >
                                <UserPlus className="w-4 h-4 mr-2" />
                                Assign Admin
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleAssignRole(profile.id, 'teacher')}
                                disabled={profile.user_roles?.some(r => r.role === 'teacher')}
                              >
                                <UserPlus className="w-4 h-4 mr-2" />
                                Assign Teacher
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleAssignRole(profile.id, 'student')}
                                disabled={profile.user_roles?.some(r => r.role === 'student')}
                              >
                                <UserPlus className="w-4 h-4 mr-2" />
                                Assign Student
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                            </>
                          )}

                          {/* Remove Roles */}
                          {isAdmin && onRemoveRole && profile.user_roles && profile.user_roles.length > 0 && (
                            <>
                              {profile.user_roles.map((userRole, index) => (
                                <DropdownMenuItem 
                                  key={index}
                                  onClick={() => handleRemoveRole(profile.id, userRole.role)}
                                  className="text-orange-600"
                                >
                                  <UserMinus className="w-4 h-4 mr-2" />
                                  Remove {userRole.role}
                                </DropdownMenuItem>
                              ))}
                              <DropdownMenuSeparator />
                            </>
                          )}

                          {/* Password Reset */}
                          {onResetPassword && (
                            <DropdownMenuItem onClick={() => handlePasswordReset(profile.email)}>
                              <Mail className="w-4 h-4 mr-2" />
                              Reset Password
                            </DropdownMenuItem>
                          )}

                          {/* Delete User - Only for admins and not current user */}
                          {isAdmin && onDeleteUser && user?.id !== profile.id && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDeleteUser(profile.id, profile.full_name, profile.email)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete User
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
