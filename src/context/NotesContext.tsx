
import { createContext, useContext, ReactNode, useEffect } from "react";
import { useProjects } from "./ProjectContext";
import { useNotesState } from "@/hooks/useNotesState";
import { Note } from "@/types/note";

type NotesContextType = {
  notes: Note[];
  interviewNotes: Note | null;
  liveNotes: Note[];
  addNote: (note: Omit<Note, "id" | "timestamp" | "userId">) => Promise<Note>;
  updateNote: (id: string, updates: Partial<Omit<Note, "id" | "userId">>) => Promise<boolean>;
  deleteNote: (id: string) => Promise<boolean>;
  exportLiveNotesAsCSV: (projectId: string) => string;
};

// Re-export the Note type
export type { Note };

const NotesContext = createContext<NotesContextType | undefined>(undefined);

export const NotesProvider = ({ children }: { children: ReactNode }) => {
  const { currentProject } = useProjects();
  const notesState = useNotesState();
  
  // Update notes when the project changes
  useEffect(() => {
    const { updateCurrentProjectNotes } = notesState;
    updateCurrentProjectNotes(currentProject?.id);
  }, [currentProject, notesState]);

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
