
import { createContext, useContext, ReactNode } from "react";
import { WatchContextType } from "./types";
import { useWatchProvider } from "./useWatchProvider";

const WatchContext = createContext<WatchContextType | undefined>(undefined);

export const WatchProvider = ({ children }: { children: ReactNode }) => {
  const watchState = useWatchProvider();

  return (
    <WatchContext.Provider value={watchState}>
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
