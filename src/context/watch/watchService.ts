
import { ref, set, get, query, limitToLast, orderByChild, equalTo } from "firebase/database";
import { database, QUERY_LIMIT } from "@/lib/firebase";
import { ProjectStopwatch } from "./types";

export const defaultStopwatch: ProjectStopwatch = {
  isRunning: false,
  startTime: null,
  elapsedTime: 0,
  lastUpdatedBy: null,
};

export const getStopwatchRef = (projectId: string) => {
  return ref(database, `projectStopwatches/${projectId}`);
};

export const getStopwatchesRef = (projectIds?: string[]) => {
  // If specific project IDs are provided, only query those
  if (projectIds && projectIds.length > 0) {
    // For a single project, get directly
    if (projectIds.length === 1) {
      return getStopwatchRef(projectIds[0]);
    }
    
    // For multiple specific projects, we handle only the first few to avoid payload issues
    return query(
      ref(database, 'projectStopwatches'),
      limitToLast(Math.min(projectIds.length, QUERY_LIMIT))
    );
  }
  
  // Default case: limit results 
  return query(
    ref(database, 'projectStopwatches'),
    limitToLast(Math.min(QUERY_LIMIT, 5)) // Further limit to avoid payload issues
  );
};

export const updateStopwatchInFirebase = (projectId: string, stopwatch: ProjectStopwatch) => {
  try {
    const stopwatchRef = getStopwatchRef(projectId);
    return set(stopwatchRef, stopwatch)
      .catch(error => {
        console.error("Error updating stopwatch in Firebase:", error);
        throw error;
      });
  } catch (error) {
    console.error("Error in updateStopwatchInFirebase:", error);
    throw error;
  }
};
