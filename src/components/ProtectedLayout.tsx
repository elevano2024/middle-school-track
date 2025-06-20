
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

const ProtectedLayout: React.FC<ProtectedLayoutProps> = ({ children }) => {
  const { user, signOut } = useAuth();
  const { isStudent, isAdmin, isTeacher } = useUserRole();
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
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-blue-700">ARCC</h1>
              <span className="text-sm text-gray-500">Student Progress Tracker</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {user.email}
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSignOut}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1">
          {children}
        </main>
      </div>
    );
  }

  // Admin/Teacher layout with sidebar
  if (isAdmin || isTeacher) {
    return (
      <>
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <header className="h-12 flex items-center border-b bg-white px-4">
            <SidebarTrigger />
          </header>
          <div className="p-6">
            {children}
          </div>
        </main>
      </>
    );
  }

  // Fallback for users without proper roles
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center">
        <p className="text-gray-600 mb-4">No role assigned. Please contact an administrator.</p>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};

export default ProtectedLayout;
