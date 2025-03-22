
import { createContext, useContext, useState, ReactNode, useEffect } from "react";

type WatchContextType = {
  isRunning: boolean;
  startTime: number | null;
  elapsedTime: number;
  currentTime: Date;
  startStopwatch: () => void;
  stopStopwatch: () => void;
  resetStopwatch: () => void;
  formatStopwatchTime: (timeMs: number) => string;
};

const WatchContext = createContext<WatchContextType | undefined>(undefined);

export const WatchProvider = ({ children }: { children: ReactNode }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Update stopwatch when running
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && startTime) {
      interval = setInterval(() => {
        setElapsedTime(Date.now() - startTime);
      }, 10); // Update every 10ms for smooth display
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, startTime]);

  const startStopwatch = () => {
    if (!isRunning) {
      setIsRunning(true);
      setStartTime(Date.now() - elapsedTime);
    }
  };

  const stopStopwatch = () => {
    if (isRunning) {
      setIsRunning(false);
    }
  };

  const resetStopwatch = () => {
    setIsRunning(false);
    setElapsedTime(0);
    setStartTime(null);
  };

  const formatStopwatchTime = (timeMs: number) => {
    // Format time as hh:mm:ss.ms
    const ms = Math.floor((timeMs % 1000) / 10); // Get only tens of ms (2 digits)
    const seconds = Math.floor((timeMs / 1000) % 60);
    const minutes = Math.floor((timeMs / (1000 * 60)) % 60);
    const hours = Math.floor(timeMs / (1000 * 60 * 60));
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  return (
    <WatchContext.Provider
      value={{
        isRunning,
        startTime,
        elapsedTime,
        currentTime,
        startStopwatch,
        stopStopwatch,
        resetStopwatch,
        formatStopwatchTime,
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
