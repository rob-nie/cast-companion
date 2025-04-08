
import { createContext, useContext, ReactNode } from "react";
import { MessagesContextType } from "./types";
import { useMessagesProvider } from "./useMessagesProvider";

const MessagesContext = createContext<MessagesContextType | undefined>(undefined);

export const MessagesProvider = ({ children }: { children: ReactNode }) => {
  const messagesState = useMessagesProvider();
  
  return (
    <MessagesContext.Provider value={messagesState}>
      {children}
    </MessagesContext.Provider>
  );
};

export const useMessages = () => {
  const context = useContext(MessagesContext);
  if (context === undefined) {
    throw new Error("useMessages must be used within a MessagesProvider");
  }
  return context;
};
