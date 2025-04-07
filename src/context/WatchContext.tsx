
import { createContext, useContext, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { useStopwatch } from "@/hooks/useStopwatch";
import { ProjectStopwatch } from "@/services/stopwatchService";
import { formatStopwatchTime } from "@/services/stopwatchService";

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

export const WatchProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const currentUserId = user?.id || "user-1";
  
  const { 
    projectStopwatches, 
    currentTime, 
    getProjectStopwatch, 
    startStopwatch, 
    stopStopwatch, 
    resetStopwatch 
  } = useStopwatch(currentUserId);

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
