import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import LoadingSpinner from '@/components/LoadingSpinner';

interface LoadingContextType {
  isLoading: boolean;
  isInitializing: boolean;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};

export const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const { loading: roleLoading } = useUserRole();
  const [isInitializing, setIsInitializing] = useState(true);

  // Comprehensive loading logic for production
  const isLoading = authLoading || (user && roleLoading);

  useEffect(() => {
    // Set initialization complete after all critical data is loaded
    if (!authLoading && (!user || !roleLoading)) {
      const timer = setTimeout(() => {
        setIsInitializing(false);
      }, 100); // Small delay to prevent flicker
      
      return () => clearTimeout(timer);
    }
  }, [authLoading, roleLoading, user]);

  // Show loading screen during initial app load or when switching users
  if (isLoading || isInitializing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-gray-900">Loading Dashboard</h2>
            <p className="text-gray-600">Please wait while we prepare your workspace...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <LoadingContext.Provider value={{ isLoading, isInitializing }}>
      {children}
    </LoadingContext.Provider>
  );
};
