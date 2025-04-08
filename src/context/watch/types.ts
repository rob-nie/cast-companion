
export type ProjectStopwatch = {
  isRunning: boolean;
  startTime: number | null;
  elapsedTime: number;
  lastUpdatedBy: string | null;
};

export type WatchContextType = {
  projectStopwatches: Record<string, ProjectStopwatch>;
  currentTime: Date;
  startStopwatch: (projectId: string) => void;
  stopStopwatch: (projectId: string) => void;
  resetStopwatch: (projectId: string) => void;
  formatStopwatchTime: (timeMs: number) => string;
  getProjectStopwatch: (projectId: string) => ProjectStopwatch;
};
