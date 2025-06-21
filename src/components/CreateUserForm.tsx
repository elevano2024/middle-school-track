import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserPlus, Eye, EyeOff, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CreateUserFormProps {
  onCreateUser: (email: string, password: string, fullName: string) => Promise<boolean>;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  password?: string;
}

export const CreateUserForm: React.FC<CreateUserFormProps> = ({ onCreateUser }) => {
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserFullName, setNewUserFullName] = useState('');
  const [creatingUser, setCreatingUser] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const { toast } = useToast();

  // Email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Password strength validation
  const validatePassword = (password: string) => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    
    const strength = Object.values(requirements).filter(Boolean).length;
    return { requirements, strength };
  };

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Full name validation
    if (!newUserFullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (newUserFullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters';
    }

    // Email validation
    if (!newUserEmail.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(newUserEmail)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!newUserPassword) {
      newErrors.password = 'Password is required';
    } else if (newUserPassword.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || creatingUser) {
      return;
    }

    setCreatingUser(true);
    try {
      const success = await onCreateUser(
        newUserEmail.trim(),
        newUserPassword,
        newUserFullName.trim()
      );
      
      if (success) {
        // Clear form on success
        setNewUserEmail('');
        setNewUserPassword('');
        setNewUserFullName('');
        setErrors({});
        setShowPassword(false);
        
        toast({
          title: "User Created",
          description: `Successfully created account for ${newUserFullName.trim()}`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create user. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCreatingUser(false);
    }
  };

  // Clear error when user starts typing
  const handleInputChange = (field: keyof FormErrors, value: string) => {
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    
    switch (field) {
      case 'fullName':
        setNewUserFullName(value);
        break;
      case 'email':
        setNewUserEmail(value);
        break;
      case 'password':
        setNewUserPassword(value);
        break;
    }
  };

  const passwordValidation = validatePassword(newUserPassword);
  const isFormValid = newUserFullName.trim().length >= 2 && 
                     emailRegex.test(newUserEmail) && 
                     newUserPassword.length >= 8;

  return (
    <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-blue-100">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-900">
          <UserPlus className="w-5 h-5 text-blue-600" />
          Create New User
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCreateUser} className="space-y-4">
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-blue-900">Full Name *</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="Enter full name"
              value={newUserFullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              className={errors.fullName ? 'border-red-500' : 'border-blue-200 focus:border-blue-500 focus:ring-blue-500'}
              disabled={creatingUser}
            />
            {errors.fullName && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <XCircle className="w-3 h-3" />
                {errors.fullName}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-blue-900">Email Address *</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter email address"
              value={newUserEmail}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={errors.email ? 'border-red-500' : 'border-blue-200 focus:border-blue-500 focus:ring-blue-500'}
              disabled={creatingUser}
            />
            {errors.email && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <XCircle className="w-3 h-3" />
                {errors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-blue-900">Password *</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password (min 8 characters)"
                value={newUserPassword}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className={errors.password ? 'border-red-500 pr-10' : 'border-blue-200 focus:border-blue-500 focus:ring-blue-500 pr-10'}
                disabled={creatingUser}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={creatingUser}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4 text-gray-400" />
                ) : (
                  <Eye className="w-4 h-4 text-gray-400" />
                )}
              </Button>
            </div>
            
            {errors.password && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <XCircle className="w-3 h-3" />
                {errors.password}
              </p>
            )}

            {/* Password Strength Indicator */}
            {newUserPassword && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-blue-900">Password strength:</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={`h-2 w-6 rounded ${
                          level <= passwordValidation.strength
                            ? level <= 2
                              ? 'bg-red-500'
                              : level <= 3
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                            : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-blue-700 font-medium">
                    {passwordValidation.strength <= 2
                      ? 'Weak'
                      : passwordValidation.strength <= 3
                      ? 'Medium'
                      : 'Strong'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(passwordValidation.requirements).map(([key, met]) => (
                    <div key={key} className={`flex items-center gap-1 ${met ? 'text-emerald-600' : 'text-gray-500'}`}>
                      {met ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      <span>
                        {key === 'length' && '8+ characters'}
                        {key === 'uppercase' && 'Uppercase letter'}
                        {key === 'lowercase' && 'Lowercase letter'}
                        {key === 'number' && 'Number'}
                        {key === 'special' && 'Special character'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <Button 
              type="submit"
              className="w-full"
              disabled={creatingUser || !isFormValid}
            >
              {creatingUser ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating User...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Create User Account
                </>
              )}
            </Button>
          </div>

          {/* Help Text */}
          <Alert className="bg-blue-50 border-blue-200">
            <AlertDescription className="text-blue-700">
              Create a new user account with email and password. The user will be able to log in immediately 
              and can be assigned roles using the table above or the role assignment form.
            </AlertDescription>
          </Alert>
        </form>
      </CardContent>
    </Card>
  );
};
