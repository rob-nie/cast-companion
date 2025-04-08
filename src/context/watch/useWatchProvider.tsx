
import { useState, useEffect } from "react";
import { onValue } from "firebase/database";
import { useUser } from "../UserContext";
import { ProjectStopwatch } from "./types";
import { defaultStopwatch, getStopwatchesRef, updateStopwatchInFirebase } from "./watchService";
import { formatStopwatchTime } from "./watchUtils";

export const useWatchProvider = () => {
  const [projectStopwatches, setProjectStopwatches] = useState<Record<string, ProjectStopwatch>>({});
  const [currentTime, setCurrentTime] = useState(new Date());
  const { user } = useUser();
  
  const currentUserId = user?.id || "user-1";

  // Load stopwatches from Firebase when user is authenticated
  useEffect(() => {
    if (!user?.id) return;
    
    const stopwatchesRef = getStopwatchesRef();
    
    const unsubscribe = onValue(stopwatchesRef, (snapshot) => {
      if (snapshot.exists()) {
        const stopwatchData = snapshot.val();
        setProjectStopwatches(stopwatchData);
      }
    });
    
    return () => unsubscribe();
  }, [user?.id]);

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

  return {
    projectStopwatches,
    currentTime,
    startStopwatch,
    stopStopwatch,
    resetStopwatch,
    formatStopwatchTime,
    getProjectStopwatch,
  };
};
