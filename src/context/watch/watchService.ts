
// This file is kept for reference but is no longer used.
// All Firebase functionality has been migrated to Supabase.

export const defaultStopwatch = {
  isRunning: false,
  startTime: null,
  elapsedTime: 0,
  lastUpdatedBy: null,
};

export const getStopwatchRef = (projectId: string) => {
  // Legacy reference
  return null;
};

export const getStopwatchesRef = (projectIds?: string[]) => {
  // Legacy reference
  return null;
};

export const updateStopwatchInFirebase = (projectId: string, stopwatch: any) => {
  console.warn("Firebase is no longer used. Use Supabase instead.");
  return Promise.resolve();
};
