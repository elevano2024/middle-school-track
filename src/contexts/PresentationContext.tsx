import React, { createContext, useContext, useState } from 'react';

interface PresentationContextType {
  isPresentationMode: boolean;
  togglePresentationMode: () => void;
  enterPresentationMode: () => void;
  exitPresentationMode: () => void;
}

const PresentationContext = createContext<PresentationContextType | undefined>(undefined);

export const usePresentationMode = () => {
  const context = useContext(PresentationContext);
  if (context === undefined) {
    throw new Error('usePresentationMode must be used within a PresentationProvider');
  }
  return context;
};

interface PresentationProviderProps {
  children: React.ReactNode;
}

export const PresentationProvider: React.FC<PresentationProviderProps> = ({ children }) => {
  const [isPresentationMode, setIsPresentationMode] = useState(false);

  const togglePresentationMode = () => {
    setIsPresentationMode(prev => !prev);
  };

  const enterPresentationMode = () => {
    setIsPresentationMode(true);
  };

  const exitPresentationMode = () => {
    setIsPresentationMode(false);
  };

  const value = {
    isPresentationMode,
    togglePresentationMode,
    enterPresentationMode,
    exitPresentationMode,
  };

  return (
    <PresentationContext.Provider value={value}>
      {children}
    </PresentationContext.Provider>
  );
}; 