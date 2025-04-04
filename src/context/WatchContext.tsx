
import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { ref, onValue, set, get } from "firebase/database";
import { database } from "@/lib/firebase";
import { useUser } from "./UserContext";

type ProjectStopwatch = {
  isRunning: boolean;
  startTime: number | null;
  elapsedTime: number;
  lastUpdatedBy: string | null;
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
  lastUpdatedBy: null,
};

export const WatchProvider = ({ children }: { children: ReactNode }) => {
  const [projectStopwatches, setProjectStopwatches] = useState<Record<string, ProjectStopwatch>>({});
  const [currentTime, setCurrentTime] = useState(new Date());
  const { user } = useUser();
  
  const currentUserId = user?.id || "user-1";

  // Subscribe to Firebase stopwatch updates
  useEffect(() => {
    const stopwatchesRef = ref(database, 'projectStopwatches');
    
    const unsubscribe = onValue(stopwatchesRef, (snapshot) => {
      if (snapshot.exists()) {
        const stopwatchData = snapshot.val();
        setProjectStopwatches(stopwatchData);
      }
    });
    
    return () => unsubscribe();
  }, []);

  // Update current time and running stopwatches every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
      
      // Update all running stopwatches locally (UI updates)
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

  // Update stopwatch in Firebase
  const updateStopwatchInFirebase = (projectId: string, stopwatch: ProjectStopwatch) => {
    const stopwatchRef = ref(database, `projectStopwatches/${projectId}`);
    set(stopwatchRef, stopwatch)
      .catch(error => {
        console.error("Error updating stopwatch in Firebase:", error);
      });
  };

  const startStopwatch = (projectId: string) => {
    // Get current stopwatch state
    const current = getProjectStopwatch(projectId);
    
    if (current.isRunning) return;
    
    // Create updated stopwatch
    const updatedStopwatch: ProjectStopwatch = {
      ...current,
      isRunning: true,
      startTime: Date.now() - current.elapsedTime,
      lastUpdatedBy: currentUserId
    };
    
    // Update Firebase (will trigger the onValue subscription in other clients)
    updateStopwatchInFirebase(projectId, updatedStopwatch);
    
    // Update local state immediately for responsive UI
    setProjectStopwatches(prev => ({
      ...prev,
      [projectId]: updatedStopwatch
    }));
  };

  const stopStopwatch = (projectId: string) => {
    // Get current stopwatch state
    const current = getProjectStopwatch(projectId);
    
    if (!current.isRunning) return;
    
    // Calculate current elapsed time
    const elapsedTime = current.startTime 
      ? Date.now() - current.startTime 
      : current.elapsedTime;
    
    // Create updated stopwatch
    const updatedStopwatch: ProjectStopwatch = {
      ...current,
      isRunning: false,
      elapsedTime,
      lastUpdatedBy: currentUserId
    };
    
    // Update Firebase
    updateStopwatchInFirebase(projectId, updatedStopwatch);
    
    // Update local state immediately
    setProjectStopwatches(prev => ({
      ...prev,
      [projectId]: updatedStopwatch
    }));
  };

  const resetStopwatch = (projectId: string) => {
    // Create reset stopwatch
    const resetStopwatch: ProjectStopwatch = {
      isRunning: false,
      startTime: null,
      elapsedTime: 0,
      lastUpdatedBy: currentUserId
    };
    
    // Update Firebase
    updateStopwatchInFirebase(projectId, resetStopwatch);
    
    // Update local state immediately
    setProjectStopwatches(prev => ({
      ...prev,
      [projectId]: resetStopwatch
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
