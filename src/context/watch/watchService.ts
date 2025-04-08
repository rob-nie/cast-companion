
import { ref, set, get, query, limitToLast, orderByChild, equalTo } from "firebase/database";
import { database, QUERY_LIMIT } from "@/lib/firebase";
import { ProjectStopwatch } from "./types";

export const defaultStopwatch: ProjectStopwatch = {
  isRunning: false,
  startTime: null,
  elapsedTime: 0,
  lastUpdatedBy: null,
};

export const getStopwatchesRef = () => {
  return query(
    ref(database, 'projectStopwatches'),
    limitToLast(QUERY_LIMIT)
  );
};

export const updateStopwatchInFirebase = (projectId: string, stopwatch: ProjectStopwatch) => {
  const stopwatchRef = ref(database, `projectStopwatches/${projectId}`);
  return set(stopwatchRef, stopwatch)
    .catch(error => {
      console.error("Error updating stopwatch in Firebase:", error);
      throw error;
    });
};
