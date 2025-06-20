import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, KeyRound, Search, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PasswordResetFormProps {
  onResetPassword: (email: string) => Promise<boolean>;
  profiles?: Array<{
    id: string;
    email: string;
    full_name: string;
  }>;
}

export const PasswordResetForm: React.FC<PasswordResetFormProps> = ({ 
  onResetPassword, 
  profiles = [] 
}) => {
  const [resetPasswordEmail, setResetPasswordEmail] = useState('');
  const [resetting, setResetting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [inputMethod, setInputMethod] = useState<'manual' | 'select'>('manual');
  const [emailError, setEmailError] = useState('');
  const { toast } = useToast();

  // Email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Filter profiles based on search term
  const filteredProfiles = useMemo(() => {
    if (!searchTerm) return profiles;
    
    return profiles.filter(profile =>
      profile.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [profiles, searchTerm]);

  // Get selected user
  const selectedUser = profiles.find(p => p.id === selectedUserId);

  // Validate email
  const validateEmail = (email: string): boolean => {
    if (!email.trim()) {
      setEmailError('Email address is required');
      return false;
    }
    
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    
    setEmailError('');
    return true;
  };

  // Handle manual email input change
  const handleEmailChange = (email: string) => {
    setResetPasswordEmail(email);
    if (emailError && email) {
      validateEmail(email);
    }
  };

  // Handle user selection
  const handleUserSelection = (userId: string) => {
    setSelectedUserId(userId);
    const user = profiles.find(p => p.id === userId);
    if (user) {
      setResetPasswordEmail(user.email);
      setEmailError('');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailToReset = inputMethod === 'select' ? selectedUser?.email : resetPasswordEmail;
    
    if (!emailToReset || !validateEmail(emailToReset) || resetting) {
      return;
    }

    // Confirmation dialog
    const userName = inputMethod === 'select' ? selectedUser?.full_name : 'the user';
    if (!confirm(`Send password reset email to ${emailToReset}?\n\nThe user will receive instructions to create a new password.`)) {
      return;
    }

    setResetting(true);
    try {
      const success = await onResetPassword(emailToReset);
      
      if (success) {
        // Clear form on success
        setResetPasswordEmail('');
        setSelectedUserId('');
        setSearchTerm('');
        setEmailError('');
        
        toast({
          title: "Reset Email Sent",
          description: `Password reset email sent to ${emailToReset}${userName !== 'the user' ? ` (${userName})` : ''}.`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send reset email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setResetting(false);
    }
  };

  const isFormValid = inputMethod === 'select' 
    ? selectedUserId && selectedUser?.email
    : resetPasswordEmail && emailRegex.test(resetPasswordEmail);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="w-5 h-5" />
          Reset User Password
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleResetPassword} className="space-y-4">
          {/* Input Method Selection */}
          {profiles.length > 0 && (
            <div className="space-y-2">
              <Label>Select Input Method</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={inputMethod === 'manual' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setInputMethod('manual');
                    setSelectedUserId('');
                    setSearchTerm('');
                  }}
                  disabled={resetting}
                >
                  Manual Email Entry
                </Button>
                <Button
                  type="button"
                  variant={inputMethod === 'select' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setInputMethod('select');
                    setResetPasswordEmail('');
                    setEmailError('');
                  }}
                  disabled={resetting}
                >
                  Select from Users
                </Button>
              </div>
            </div>
          )}

          {/* Manual Email Input */}
          {inputMethod === 'manual' && (
            <div className="space-y-2">
              <Label htmlFor="resetEmail">User Email Address *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="resetEmail"
                  type="email"
                  placeholder="Enter user's email address"
                  value={resetPasswordEmail}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  onBlur={() => resetPasswordEmail && validateEmail(resetPasswordEmail)}
                  className={`pl-10 ${emailError ? 'border-red-500' : ''}`}
                  disabled={resetting}
                />
              </div>
              {emailError && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {emailError}
                </p>
              )}
            </div>
          )}

          {/* User Selection */}
          {inputMethod === 'select' && profiles.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="userSearch">Search and Select User *</Label>
              <div className="space-y-2">
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="userSearch"
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    disabled={resetting}
                  />
                </div>

                {/* User Selection */}
                <Select 
                  value={selectedUserId} 
                  onValueChange={handleUserSelection}
                  disabled={resetting}
                >
                  <SelectTrigger>
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
                      <div className="p-2 text-center text-gray-500 text-sm">
                        {searchTerm ? 'No users match your search' : 'No users available'}
                      </div>
                    ) : (
                      filteredProfiles.map((profile) => (
                        <SelectItem key={profile.id} value={profile.id}>
                          <div className="flex flex-col">
                            <div className="font-medium">{profile.full_name}</div>
                            <div className="text-xs text-gray-500">{profile.email}</div>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Selected User Info */}
              {selectedUser && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-900">{selectedUser.full_name}</p>
                      <p className="text-sm text-blue-700">{selectedUser.email}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <Button 
              type="submit"
              className="w-full"
              disabled={resetting || !isFormValid}
            >
              {resetting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending Reset Email...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Send Password Reset Email
                </>
              )}
            </Button>
          </div>

          {/* Help Text */}
          <Alert>
            <AlertDescription>
              This will send a password reset email to the specified user. They will receive a secure link 
              to create a new password. The reset link will expire after 24 hours for security.
            </AlertDescription>
          </Alert>

          {/* Additional Info */}
          {isFormValid && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Ready to send reset email to:{' '}
                <strong>
                  {inputMethod === 'select' ? selectedUser?.email : resetPasswordEmail}
                </strong>
                {inputMethod === 'select' && selectedUser?.full_name && (
                  <span> ({selectedUser.full_name})</span>
                )}
              </AlertDescription>
            </Alert>
          )}
        </form>
      </CardContent>
    </Card>
  );
};
