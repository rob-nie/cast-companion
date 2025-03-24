
import { createContext, useContext, useState, ReactNode, useEffect } from "react";

type ProjectStopwatch = {
  isRunning: boolean;
  startTime: number | null;
  elapsedTime: number;
};

type WatchContextType = {
  projectStopwatches: Record<string, ProjectStopwatch>;
  currentTime: Date;
  startStopwatch: (projectId: string) => void;
  stopStopwatch: (projectId: string) => void;
  resetStopwatch: (projectId: string) => void;
  formatStopwatchTime: (timeMs: number) => string;
  getProjectStopwatch: (projectId: string) => ProjectStopwatch;
};

const WatchContext = createContext<WatchContextType | undefined>(undefined);

const defaultStopwatch: ProjectStopwatch = {
  isRunning: false,
  startTime: null,
  elapsedTime: 0,
};

export const WatchProvider = ({ children }: { children: ReactNode }) => {
  const [projectStopwatches, setProjectStopwatches] = useState<Record<string, ProjectStopwatch>>({});
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
      
      // Update all running stopwatches
      setProjectStopwatches(prev => {
        const updated = { ...prev };
        let hasChanges = false;
        
        Object.entries(updated).forEach(([projectId, stopwatch]) => {
          if (stopwatch.isRunning && stopwatch.startTime) {
            updated[projectId] = {
              ...stopwatch,
              elapsedTime: Date.now() - stopwatch.startTime
            };
            hasChanges = true;
          }
        });
        
        return hasChanges ? updated : prev;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const getProjectStopwatch = (projectId: string): ProjectStopwatch => {
    return projectStopwatches[projectId] || defaultStopwatch;
  };

  const startStopwatch = (projectId: string) => {
    setProjectStopwatches(prev => {
      const current = prev[projectId] || defaultStopwatch;
      
      if (current.isRunning) return prev;
      
      return {
        ...prev,
        [projectId]: {
          ...current,
          isRunning: true,
          startTime: Date.now() - current.elapsedTime
        }
      };
    });
  };

  const stopStopwatch = (projectId: string) => {
    setProjectStopwatches(prev => {
      const current = prev[projectId] || defaultStopwatch;
      
      if (!current.isRunning) return prev;
      
      return {
        ...prev,
        [projectId]: {
          ...current,
          isRunning: false
        }
      };
    });
  };

  const resetStopwatch = (projectId: string) => {
    setProjectStopwatches(prev => ({
      ...prev,
      [projectId]: {
        isRunning: false,
        startTime: null,
        elapsedTime: 0
      }
    }));
  };

  const formatStopwatchTime = (timeMs: number) => {
    // Format time as hh:mm:ss without milliseconds
    const seconds = Math.floor((timeMs / 1000) % 60);
    const minutes = Math.floor((timeMs / (1000 * 60)) % 60);
    const hours = Math.floor(timeMs / (1000 * 60 * 60));
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <WatchContext.Provider
      value={{
        projectStopwatches,
        currentTime,
        startStopwatch,
        stopStopwatch,
        resetStopwatch,
        formatStopwatchTime,
        getProjectStopwatch,
      }}
    >
      {children}
    </WatchContext.Provider>
  );
};

export const useWatch = () => {
  const context = useContext(WatchContext);
  if (context === undefined) {
    throw new Error("useWatch must be used within a WatchProvider");
  }
  return context;
};
