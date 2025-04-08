
import { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "@/lib/firebase";
import { useUser } from "../UserContext";
import { ProjectStopwatch, defaultStopwatch } from "./types";
import { updateStopwatchInFirebase } from "./watchService";

export const useWatchProvider = () => {
  const [projectStopwatches, setProjectStopwatches] = useState<Record<string, ProjectStopwatch>>({});
  const [currentTime, setCurrentTime] = useState(new Date());
  const { user } = useUser();
  
  const currentUserId = user?.id || "user-1";

  // Subscribe to Firebase stopwatch updates
  useEffect(() => {
    const stopwatchesRef = ref(database, 'projectStopwatches');
    
    const unsubscribe = onValue(stopwatchesRef, (snapshot) => {
      if (snapshot.exists()) {
        console.log("Firebase stopwatch data updated:", snapshot.val());
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

  const startStopwatch = async (projectId: string) => {
    // Get current stopwatch state
    const current = getProjectStopwatch(projectId);
    
    if (current.isRunning) return;
    
    console.log("Starting stopwatch for project:", projectId);
    
    // Create updated stopwatch
    const updatedStopwatch: ProjectStopwatch = {
      ...current,
      isRunning: true,
      startTime: Date.now() - current.elapsedTime,
      lastUpdatedBy: currentUserId
    };
    
    // Update local state immediately for responsive UI
    setProjectStopwatches(prev => ({
      ...prev,
      [projectId]: updatedStopwatch
    }));
    
    // Update Firebase (will trigger the onValue subscription in other clients)
    await updateStopwatchInFirebase(projectId, updatedStopwatch);
  };

  const stopStopwatch = async (projectId: string) => {
    // Get current stopwatch state
    const current = getProjectStopwatch(projectId);
    
    if (!current.isRunning) return;
    
    console.log("Stopping stopwatch for project:", projectId);
    
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
    
    // Update local state immediately
    setProjectStopwatches(prev => ({
      ...prev,
      [projectId]: updatedStopwatch
    }));
    
    // Update Firebase
    await updateStopwatchInFirebase(projectId, updatedStopwatch);
  };

  const resetStopwatch = async (projectId: string) => {
    console.log("Resetting stopwatch for project:", projectId);
    
    // Create reset stopwatch
    const resetStopwatch: ProjectStopwatch = {
      isRunning: false,
      startTime: null,
      elapsedTime: 0,
      lastUpdatedBy: currentUserId
    };
    
    // Update local state immediately
    setProjectStopwatches(prev => ({
      ...prev,
      [projectId]: resetStopwatch
    }));
    
    // Update Firebase
    await updateStopwatchInFirebase(projectId, resetStopwatch);
  };

  return {
    projectStopwatches,
    currentTime,
    startStopwatch,
    stopStopwatch,
    resetStopwatch,
    getProjectStopwatch
  };
};
