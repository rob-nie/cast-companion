
import React from 'react';

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ message = "Wird geladen..." }) => {
  return (
    <div className="flex items-center justify-center h-screen w-full bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-lg text-muted-foreground">{message}</p>
      </div>
    </div>
  );
};

export default LoadingScreen;
