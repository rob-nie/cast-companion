
import { createContext, useContext, ReactNode } from "react";
import { WatchContextType } from "./types";
import { useWatchProvider } from "./useWatchProvider";
import { formatStopwatchTime } from "./watchUtils";

const WatchContext = createContext<WatchContextType | undefined>(undefined);

export const WatchProvider = ({ children }: { children: ReactNode }) => {
  const watchProviderData = useWatchProvider();

  return (
    <WatchContext.Provider
      value={{
        ...watchProviderData,
        formatStopwatchTime
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
