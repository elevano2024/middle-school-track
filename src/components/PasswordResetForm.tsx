
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface PasswordResetFormProps {
  onResetPassword: (email: string) => Promise<boolean>;
}

export const PasswordResetForm: React.FC<PasswordResetFormProps> = ({ onResetPassword }) => {
  const [resetPasswordEmail, setResetPasswordEmail] = useState('');
  const [resetting, setResetting] = useState(false);

  const handleResetPassword = async () => {
    if (!resetPasswordEmail) {
      return;
    }

    setResetting(true);
    const success = await onResetPassword(resetPasswordEmail);
    
    if (success) {
      setResetPasswordEmail('');
    }
    
    setResetting(false);
  };

  return (
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
          <Button 
            onClick={handleResetPassword}
            disabled={resetting || !resetPasswordEmail}
          >
            {resetting ? 'Sending...' : 'Send Reset Email'}
          </Button>
        </div>
        <p className="text-sm text-gray-600">
          This will send a password reset email to the user. They can use it to set a new password.
        </p>
      </CardContent>
    </Card>
  );
};
