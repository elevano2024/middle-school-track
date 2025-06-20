
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useStudents } from '@/hooks/useStudents';
import { useSubjects } from '@/hooks/useSubjects';
import { useTasks } from '@/hooks/useTasks';
import { useAttendance } from '@/hooks/useAttendance';
import LoadingSpinner from '@/components/LoadingSpinner';

interface LoadingContextType {
  isLoading: boolean;
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
  const { loading: authLoading } = useAuth();
  const { loading: roleLoading } = useUserRole();
  const { loading: studentsLoading } = useStudents();
  const { loading: subjectsLoading } = useSubjects();
  const { loading: tasksLoading } = useTasks();
  const { loading: attendanceLoading } = useAttendance();

  // Determine if any critical loading is happening
  const isLoading = authLoading || 
                   roleLoading || 
                   studentsLoading || 
                   subjectsLoading || 
                   tasksLoading || 
                   attendanceLoading;

  // Show unified loading screen when any critical data is loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading your dashboard..." />
      </div>
    );
  }

  return (
    <LoadingContext.Provider value={{ isLoading }}>
      {children}
    </LoadingContext.Provider>
  );
};
