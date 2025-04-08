
import { createContext, useContext, ReactNode } from "react";
import { NotesContextType } from "./types";
import { useNotesProvider } from "./useNotesProvider";

const NotesContext = createContext<NotesContextType | undefined>(undefined);

export const NotesProvider = ({ children }: { children: ReactNode }) => {
  const notesState = useNotesProvider();

  return (
    <NotesContext.Provider value={notesState}>
      {children}
    </NotesContext.Provider>
  );
};

export const useNotes = () => {
  const context = useContext(NotesContext);
  if (!context) {
    throw new Error("useNotes must be used within a NotesProvider");
  }
  return context;
};
