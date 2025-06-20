
import React from 'react';
import { useUserRole } from '@/hooks/useUserRole';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

interface PermissionGuardProps {
  children: React.ReactNode;
  requiredRoles: ('admin' | 'teacher')[];
  fallbackMessage?: string;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({ 
  children, 
  requiredRoles, 
  fallbackMessage = "You don't have permission to access this feature." 
}) => {
  const { role, loading, isAdmin, isTeacher } = useUserRole();

  // Show loading while checking permissions
  if (loading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <LoadingSpinner text="Loading..." />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if user has required role
  const hasRequiredRole = requiredRoles.some(requiredRole => {
    if (requiredRole === 'admin') return isAdmin;
    if (requiredRole === 'teacher') return isTeacher;
    return false;
  });

  if (!hasRequiredRole) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              <p>{fallbackMessage}</p>
            </div>
            {role && (
              <p className="text-sm text-muted-foreground mt-2">
                Current role: {role}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};
