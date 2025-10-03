import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import EditStudentGradeDialog from '@/components/EditStudentGradeDialog';
import { AlertTriangle, Search, Users, UserPlus, UserMinus, MoreVertical, Mail, Trash2, GraduationCap } from 'lucide-react';
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
import { supabase } from '@/integrations/supabase/client';

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
  const [editingStudent, setEditingStudent] = useState<{ id: string; name: string; grade: string } | null>(null);
  const [studentGrades, setStudentGrades] = useState<Record<string, string>>({});
  const { isAdmin } = useUserRole();
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch student grades from the students table
  useEffect(() => {
    const fetchStudentGrades = async () => {
      const { data, error } = await supabase
        .from('students')
        .select('id, grade');
      
      if (data && !error) {
        const gradesMap = data.reduce((acc, student) => {
          acc[student.id] = student.grade;
          return acc;
        }, {} as Record<string, string>);
        setStudentGrades(gradesMap);
      }
    };
    
    fetchStudentGrades();
  }, []);

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
      <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-blue-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Users className="w-5 h-5 text-blue-600" />
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
      <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-blue-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Users className="w-5 h-5 text-blue-600" />
            Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 text-rose-600">
            <AlertTriangle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Edit Grade Dialog */}
      <EditStudentGradeDialog
        student={editingStudent}
        isOpen={!!editingStudent}
        onClose={() => setEditingStudent(null)}
        onSuccess={async () => {
          setEditingStudent(null);
          // Refresh student grades
          const { data } = await supabase
            .from('students')
            .select('id, grade');
          if (data) {
            const gradesMap = data.reduce((acc, student) => {
              acc[student.id] = student.grade;
              return acc;
            }, {} as Record<string, string>);
            setStudentGrades(gradesMap);
          }
        }}
      />

      <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-blue-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Users className="w-5 h-5 text-blue-600" />
            Users ({filteredProfiles.length})
            {filteredProfiles.length !== profiles.length && (
              <span className="text-sm font-normal text-blue-600">
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
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 w-4 h-4" />
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-blue-200 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {/* Role Filter */}
          <Select value={roleFilter} onValueChange={(value: typeof roleFilter) => setRoleFilter(value)}>
            <SelectTrigger className="border-blue-200 focus:border-blue-500 focus:ring-blue-500">
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
          <div className="text-center py-8 text-blue-600">
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
                <TableRow className="bg-gradient-to-r from-blue-50 to-indigo-50">
                  <TableHead className="text-blue-900 font-semibold">User</TableHead>
                  <TableHead className="text-blue-900 font-semibold">Email</TableHead>
                  <TableHead className="text-blue-900 font-semibold">Roles</TableHead>
                  <TableHead className="text-blue-900 font-semibold">Joined</TableHead>
                  <TableHead className="text-right text-blue-900 font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-blue-100">
                {filteredProfiles.map((profile) => (
                  <TableRow key={profile.id} className="hover:bg-blue-50/50 transition-colors">
                    <TableCell className="font-medium text-blue-900">
                      {profile.full_name || 'No Name'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-blue-400" />
                        <span className="text-gray-700">{profile.email}</span>
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
                          <Badge variant="outline" className="text-xs border-blue-200 text-blue-600">
                            No role assigned
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-700">
                      {new Date(profile.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            disabled={processingUserId === profile.id}
                            className="hover:bg-blue-50"
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
                                  className="text-amber-600"
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

                          {/* Edit Grade - Only for users with student role */}
                          {profile.user_roles?.some(r => r.role === 'student') && studentGrades[profile.id] && (
                            <DropdownMenuItem 
                              onClick={() => setEditingStudent({
                                id: profile.id,
                                name: profile.full_name,
                                grade: studentGrades[profile.id]
                              })}
                            >
                              <GraduationCap className="w-4 h-4 mr-2" />
                              Edit Grade
                            </DropdownMenuItem>
                          )}

                          {/* Delete User - Only for admins and not current user */}
                          {isAdmin && onDeleteUser && user?.id !== profile.id && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDeleteUser(profile.id, profile.full_name, profile.email)}
                                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
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
    </>
  );
};
