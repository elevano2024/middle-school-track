import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Quote, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [searchParams] = useSearchParams();
  const { signIn, signUp, user, resetPassword, updatePassword } = useAuth();
  const navigate = useNavigate();

  const isResetMode = searchParams.get('mode') === 'reset';
  const errorCode = searchParams.get('error_code');
  const errorDescription = searchParams.get('error_description');

  useEffect(() => {
    if (user && !isResetMode) {
      navigate('/');
    }
  }, [user, navigate, isResetMode]);

  // Handle password reset errors (expired/invalid links)
  useEffect(() => {
    if (errorCode === 'otp_expired') {
      toast.error('Password reset link has expired. Please request a new one.');
      setShowForgotPassword(true);
      // Clean up URL
      navigate('/auth', { replace: true });
    } else if (errorCode) {
      toast.error(errorDescription || 'An error occurred. Please try again.');
      navigate('/auth', { replace: true });
    }
  }, [errorCode, errorDescription, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const { error } = await signIn(email, password);
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Welcome back! Successfully signed in.');
      navigate('/');
    }
    
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const { error } = await signUp(email, password, fullName);
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Account created successfully! Please check your email to verify your account.');
    }
    
    setIsLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const { error } = await resetPassword(resetEmail);
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Password reset email sent! Please check your inbox.');
      setShowForgotPassword(false);
      setResetEmail('');
    }
    
    setIsLoading(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    setIsLoading(true);
    
    const { error } = await updatePassword(newPassword);
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Password updated successfully! You can now sign in.');
      navigate('/auth');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:px-12 xl:px-20 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="max-w-md mx-auto space-y-8">
          {/* Logo and School Name */}
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg p-2">
                <img 
                  src="https://risingsunmontessori.org/wp-content/uploads/2022/02/logo-e1709591143216.jpg" 
                  alt="Rising Sun Montessori School Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
                  Rising Sun
                </h1>
                <p className="text-lg text-gray-600 font-medium">Montessori School</p>
              </div>
            </div>
          </div>

          {/* Quote Section */}
          <div className="space-y-6">
            <div className="relative">
              <Quote className="absolute -top-2 -left-2 w-8 h-8 text-blue-200" />
              <blockquote className="text-xl text-gray-700 leading-relaxed italic pl-6">
                "The greatest sign of success for a teacher is to be able to say, 'The children are now working as if I did not exist.'"
              </blockquote>
              <cite className="block text-right text-blue-600 font-semibold mt-4 text-lg">
                — Maria Montessori
              </cite>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="space-y-4 text-gray-500">
            <div className="w-16 h-1 bg-gradient-to-r from-blue-300 to-indigo-300 rounded-full"></div>
            <p className="text-sm leading-relaxed">
              Empowering students to discover their potential through self-directed learning and collaborative growth.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 xl:px-12 bg-white">
        <div className="mx-auto w-full max-w-md">
          {/* Mobile Header (shown only on small screens) */}
          <div className="lg:hidden text-center space-y-4 mb-8">
            <div className="flex justify-center">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-md p-1.5">
                <img 
                  src="https://risingsunmontessori.org/wp-content/uploads/2022/02/logo-e1709591143216.jpg" 
                  alt="Rising Sun Montessori School Logo"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Rising Sun Montessori</h1>
              <p className="text-gray-600">Student Progress Tracker</p>
            </div>
          </div>

          {/* Login Form */}
          <Card className="shadow-lg border border-gray-100">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl text-center text-gray-900">
                {isResetMode ? 'Reset Password' : showForgotPassword ? 'Forgot Password' : 'Welcome Back'}
              </CardTitle>
              <CardDescription className="text-center text-gray-600">
                {isResetMode 
                  ? 'Enter your new password below' 
                  : showForgotPassword 
                    ? 'Enter your email to receive a password reset link' 
                    : 'Sign in to access your dashboard'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isResetMode ? (
                // Password Reset Form
                <form onSubmit={handleUpdatePassword} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="new-password" className="text-sm font-medium text-gray-700">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="text-sm font-medium text-gray-700">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      required
                      minLength={6}
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium" 
                    disabled={isLoading}
                  >
                    {isLoading ? 'Updating Password...' : 'Update Password'}
                  </Button>
                </form>
              ) : showForgotPassword ? (
                // Forgot Password Form
                <div className="space-y-5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowForgotPassword(false)}
                    className="mb-2 text-gray-600 hover:text-gray-900"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Sign In
                  </Button>
                  <form onSubmit={handleForgotPassword} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="reset-email" className="text-sm font-medium text-gray-700">Email</Label>
                      <Input
                        id="reset-email"
                        type="email"
                        placeholder="Enter your email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium" 
                      disabled={isLoading}
                    >
                      {isLoading ? 'Sending...' : 'Send Reset Link'}
                    </Button>
                  </form>
                </div>
              ) : (
                // Sign In/Sign Up Tabs
                <Tabs defaultValue="signin" className="w-full">
                  {/* <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-100">
                    <TabsTrigger value="signin" className="data-[state=active]:bg-white">Sign In</TabsTrigger>
                    <TabsTrigger value="signup" className="data-[state=active]:bg-white">Sign Up</TabsTrigger>
                  </TabsList> */}
                  
                  <TabsContent value="signin">
                    <form onSubmit={handleSignIn} className="space-y-5">
                      <div className="space-y-2">
                        <Label htmlFor="signin-email" className="text-sm font-medium text-gray-700">Email</Label>
                        <Input
                          id="signin-email"
                          type="email"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="signin-password" className="text-sm font-medium text-gray-700">Password</Label>
                          <button
                            type="button"
                            onClick={() => setShowForgotPassword(true)}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Forgot Password?
                          </button>
                        </div>
                        <Input
                          id="signin-password"
                          type="password"
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium" 
                        disabled={isLoading}
                      >
                        {isLoading ? 'Signing in...' : 'Sign In'}
                      </Button>
                    </form>
                  </TabsContent>
                
                <TabsContent value="signup">
                  <form onSubmit={handleSignUp} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name" className="text-sm font-medium text-gray-700">Full Name</Label>
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Enter your full name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="text-sm font-medium text-gray-700">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="text-sm font-medium text-gray-700">Password</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="Create a password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium" 
                      disabled={isLoading}
                    >
                      {isLoading ? 'Creating account...' : 'Create Account'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
              )}

              {!isResetMode && (
                <div className="text-center text-sm text-gray-500 border-t pt-6">
                  Need help? Contact your administrator
                </div>
              )}
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center text-xs text-gray-400 mt-8">
            © 2024 Rising Sun Montessori School
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
