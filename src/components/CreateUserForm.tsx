
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface CreateUserFormProps {
  onCreateUser: (email: string, password: string, fullName: string) => Promise<boolean>;
}

export const CreateUserForm: React.FC<CreateUserFormProps> = ({ onCreateUser }) => {
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserFullName, setNewUserFullName] = useState('');
  const [creatingUser, setCreatingUser] = useState(false);

  const handleCreateUser = async () => {
    if (!newUserEmail || !newUserPassword || !newUserFullName) {
      return;
    }

    if (newUserPassword.length < 6) {
      return;
    }

    setCreatingUser(true);
    const success = await onCreateUser(newUserEmail, newUserPassword, newUserFullName);
    
    if (success) {
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserFullName('');
    }
    
    setCreatingUser(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New User</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input
            type="text"
            placeholder="Full Name"
            value={newUserFullName}
            onChange={(e) => setNewUserFullName(e.target.value)}
          />
          <Input
            type="email"
            placeholder="Email Address"
            value={newUserEmail}
            onChange={(e) => setNewUserEmail(e.target.value)}
          />
          <Input
            type="password"
            placeholder="Password (min 6 chars)"
            value={newUserPassword}
            onChange={(e) => setNewUserPassword(e.target.value)}
          />
          <Button 
            onClick={handleCreateUser} 
            className="w-full"
            disabled={creatingUser || !newUserEmail || !newUserPassword || !newUserFullName || newUserPassword.length < 6}
          >
            {creatingUser ? 'Creating...' : 'Create User'}
          </Button>
        </div>
        <p className="text-sm text-gray-600">
          Create a new user account with email and password. The user will be able to log in immediately.
        </p>
      </CardContent>
    </Card>
  );
};
