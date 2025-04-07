
import { ref, onValue, set } from "firebase/database";
import { database } from "@/lib/firebase";

export type ProjectStopwatch = {
  isRunning: boolean;
  startTime: number | null;
  elapsedTime: number;
  lastUpdatedBy: string | null;
};

export const defaultStopwatch: ProjectStopwatch = {
  isRunning: false,
  startTime: null,
  elapsedTime: 0,
  lastUpdatedBy: null,
};

// Subscribe to Firebase stopwatch updates
export const subscribeToStopwatches = (
  callback: (stopwatches: Record<string, ProjectStopwatch>) => void
) => {
  const stopwatchesRef = ref(database, 'projectStopwatches');
  
  const unsubscribe = onValue(stopwatchesRef, (snapshot) => {
    if (snapshot.exists()) {
      const stopwatchData = snapshot.val();
      callback(stopwatchData);
    }
  });
  
  return unsubscribe;
};

// Update stopwatch in Firebase
export const updateStopwatchInFirebase = (
  projectId: string, 
  stopwatch: ProjectStopwatch
) => {
  const stopwatchRef = ref(database, `projectStopwatches/${projectId}`);
  return set(stopwatchRef, stopwatch)
    .catch(error => {
      console.error("Error updating stopwatch in Firebase:", error);
      throw error;
    });
};

// Format time as hh:mm:ss
export const formatStopwatchTime = (timeMs: number) => {
  const seconds = Math.floor((timeMs / 1000) % 60);
  const minutes = Math.floor((timeMs / (1000 * 60)) % 60);
  const hours = Math.floor(timeMs / (1000 * 60 * 60));
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};
