
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

interface Profile {
  id: string;
  email: string;
  full_name: string;
}

interface RoleAssignmentFormProps {
  profiles: Profile[];
  onAssignRole: (userId: string, role: 'admin' | 'teacher' | 'student') => Promise<boolean>;
}

export const RoleAssignmentForm: React.FC<RoleAssignmentFormProps> = ({ profiles, onAssignRole }) => {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState<'admin' | 'teacher' | 'student' | ''>('');
  const [assigning, setAssigning] = useState(false);

  const handleAssignRole = async () => {
    if (!selectedUserId || !selectedRole) {
      return;
    }

    setAssigning(true);
    const success = await onAssignRole(selectedUserId, selectedRole);
    
    if (success) {
      setSelectedUserId('');
      setSelectedRole('');
    }
    
    setAssigning(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assign Role</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <Button 
            onClick={handleAssignRole} 
            className="w-full"
            disabled={assigning || !selectedUserId || !selectedRole}
          >
            {assigning ? 'Assigning...' : 'Assign Role'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
