import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserCog, Search, Users, Loader2, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  email: string;
  full_name: string;
  user_roles?: { role: 'admin' | 'teacher' | 'student' }[];
}

interface RoleAssignmentFormProps {
  profiles: Profile[];
  onAssignRole: (userId: string, role: 'admin' | 'teacher' | 'student') => Promise<boolean>;
}

export const RoleAssignmentForm: React.FC<RoleAssignmentFormProps> = ({ profiles, onAssignRole }) => {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState<'admin' | 'teacher' | 'student' | ''>('');
  const [assigning, setAssigning] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  // Filter profiles based on search term
  const filteredProfiles = useMemo(() => {
    if (!searchTerm) return profiles;
    
    return profiles.filter(profile =>
      profile.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [profiles, searchTerm]);

  // Get selected user details
  const selectedUser = profiles.find(p => p.id === selectedUserId);

  // Check if user already has the selected role
  const userHasRole = selectedUser?.user_roles?.some(r => r.role === selectedRole);

  // Get role color for badges
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'teacher': return 'default';
      case 'student': return 'secondary';
      default: return 'outline';
    }
  };

  const handleAssignRole = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUserId || !selectedRole || assigning) {
      return;
    }

    if (userHasRole) {
      toast({
        title: "Role Already Assigned",
        description: `${selectedUser?.full_name} already has the ${selectedRole} role.`,
        variant: "destructive",
      });
      return;
    }

    setAssigning(true);
    try {
      const success = await onAssignRole(selectedUserId, selectedRole);
      
      if (success) {
        setSelectedUserId('');
        setSelectedRole('');
        setSearchTerm('');
        
        toast({
          title: "Role Assigned",
          description: `Successfully assigned ${selectedRole} role to ${selectedUser?.full_name}.`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to assign role. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAssigning(false);
    }
  };

  const isFormValid = selectedUserId && selectedRole && !userHasRole;

  return (
    <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-blue-100">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-900">
          <UserCog className="w-5 h-5 text-blue-600" />
          Assign Role to User
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleAssignRole} className="space-y-4">
          {/* User Search and Selection */}
          <div className="space-y-2">
            <Label htmlFor="userSearch" className="text-blue-900">Search and Select User *</Label>
            <div className="space-y-2">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 w-4 h-4" />
                <Input
                  id="userSearch"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                  disabled={assigning}
                />
              </div>

              {/* User Selection */}
              <Select 
                value={selectedUserId} 
                onValueChange={setSelectedUserId}
                disabled={assigning}
              >
                <SelectTrigger className="border-blue-200 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue placeholder={
                    filteredProfiles.length === 0 
                      ? searchTerm 
                        ? "No users found" 
                        : "Choose a user"
                      : "Choose a user"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {filteredProfiles.length === 0 ? (
                    <div className="p-2 text-center text-blue-600 text-sm">
                      {searchTerm ? 'No users match your search' : 'No users available'}
                    </div>
                  ) : (
                    filteredProfiles.map(profile => (
                      <SelectItem key={profile.id} value={profile.id}>
                        <div className="flex items-center justify-between w-full">
                          <div>
                            <div className="font-medium">{profile.full_name}</div>
                            <div className="text-sm text-gray-500">{profile.email}</div>
                          </div>
                          <div className="flex gap-1 ml-2">
                            {profile.user_roles && profile.user_roles.length > 0 ? (
                              profile.user_roles.map((userRole, index) => (
                                <Badge 
                                  key={index} 
                                  variant={getRoleColor(userRole.role)}
                                  className="text-xs"
                                >
                                  {userRole.role}
                                </Badge>
                              ))
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                No role
                              </Badge>
                            )}
                          </div>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {selectedUser && (
              <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-blue-900">{selectedUser.full_name}</p>
                    <p className="text-sm text-blue-600">{selectedUser.email}</p>
                  </div>
                  <div className="flex gap-1">
                    {selectedUser.user_roles && selectedUser.user_roles.length > 0 ? (
                      selectedUser.user_roles.map((userRole, index) => (
                        <Badge 
                          key={index} 
                          variant={getRoleColor(userRole.role)}
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
                </div>
              </div>
            )}
          </div>

          {/* Role Selection */}
          <div className="space-y-2">
            <Label htmlFor="roleSelect" className="text-blue-900">Select Role to Assign *</Label>
            <Select 
              value={selectedRole} 
              onValueChange={(value: 'admin' | 'teacher' | 'student') => setSelectedRole(value)}
              disabled={assigning}
            >
              <SelectTrigger id="roleSelect" className="border-blue-200 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder="Choose a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive" className="text-xs">Admin</Badge>
                    <span className="text-sm text-gray-600">Full system access</span>
                  </div>
                </SelectItem>
                <SelectItem value="teacher">
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="text-xs">Teacher</Badge>
                    <span className="text-sm text-gray-600">Can manage students and content</span>
                  </div>
                </SelectItem>
                <SelectItem value="student">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">Student</Badge>
                    <span className="text-sm text-gray-600">Can access assigned tasks</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Warning for existing role */}
          {userHasRole && selectedUser && selectedRole && (
            <Alert className="bg-amber-50 border-amber-200">
              <Info className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-700">
                <strong>{selectedUser.full_name}</strong> already has the <strong>{selectedRole}</strong> role. 
                Please select a different role or use the users table to remove existing roles first.
              </AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <Button 
              type="submit"
              className="w-full"
              disabled={assigning || !isFormValid}
            >
              {assigning ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Assigning Role...
                </>
              ) : (
                <>
                  <Users className="w-4 h-4 mr-2" />
                  Assign {selectedRole ? selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1) : ''} Role
                </>
              )}
            </Button>
          </div>

          {/* Help Text */}
          <Alert className="bg-blue-50 border-blue-200">
            <AlertDescription className="text-blue-700">
              Assign roles to users to control their access levels. Users can have multiple roles, 
              and role assignments will automatically sync with the students table for student roles.
            </AlertDescription>
          </Alert>
        </form>
      </CardContent>
    </Card>
  );
};
