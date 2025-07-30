import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { usePresentationMode } from '@/contexts/PresentationContext';
import { AppSidebar } from '@/components/AppSidebar';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import CheckInButton from '@/components/CheckInButton';

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

const ProtectedLayout: React.FC<ProtectedLayoutProps> = ({ children }) => {
  const { user, signOut } = useAuth();
  const { isStudent, isAdmin, isTeacher, loading: roleLoading, error: roleError } = useUserRole();
  const { isPresentationMode } = usePresentationMode();
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    if (!user && location.pathname !== '/auth') {
      navigate('/auth');
    }
  }, [user, navigate, location]);

  if (!user) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
  };

  // Student layout - clean navbar only, no sidebar
  if (isStudent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 w-full">
        <header className="bg-white/80 backdrop-blur-sm border-b border-blue-100 py-4 shadow-sm">
          <div className="flex items-center justify-between px-6">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center">
                  <img 
                    src="https://risingsunmontessori.org/wp-content/uploads/2022/02/logo-e1709591143216.jpg" 
                    alt="Rising Sun Montessori School Logo"
                    className="w-6 h-6 object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-lg font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">ARCC</h1>
                  <span className="text-xs text-blue-600">Student Progress Tracker</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-blue-700 font-medium">
                Welcome, {user.email?.split('@')[0]}
              </span>
              <CheckInButton />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSignOut}
                className="flex items-center gap-2 border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 w-full">
          {children}
        </main>
      </div>
    );
  }

  // Admin/Teacher layout with sidebar
  if (isAdmin || isTeacher) {
    // Presentation mode - hide sidebar and padding for full-screen view
    if (isPresentationMode) {
      return (
        <main className="flex-1 overflow-auto w-full">
          <div className="bg-gradient-to-br from-blue-50/30 via-indigo-50/30 to-purple-50/30 min-h-screen">
            {children}
          </div>
        </main>
      );
    }

    // Normal mode with sidebar
    return (
      <>
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <div className="p-6 bg-gradient-to-br from-blue-50/30 via-indigo-50/30 to-purple-50/30 min-h-screen">
            {children}
          </div>
        </main>
      </>
    );
  }

  // Fallback for users without roles - only show if role loading is complete
  if (!roleLoading && !isStudent && !isAdmin && !isTeacher) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Access Pending</h2>
            <p className="text-gray-600 mb-6">
              Your account is being set up. Please wait while an administrator assigns your role, or contact support if this continues.
            </p>
            <Button 
              onClick={handleSignOut}
              variant="outline"
              className="border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out & Try Different Account
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state while role is being determined
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-blue-600">Setting up your workspace...</p>
      </div>
    </div>
  );
};

export default ProtectedLayout;
