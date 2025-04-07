
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
    if (currentProject && notesState.updateCurrentProjectNotes) {
      notesState.updateCurrentProjectNotes(currentProject.id);
    }
  }, [currentProject, notesState]);

  // Create a stable context value object
  const contextValue: NotesContextType = {
    notes: notesState.notes,
    interviewNotes: notesState.interviewNotes,
    liveNotes: notesState.liveNotes,
    addNote: notesState.addNote,
    updateNote: notesState.updateNote,
    deleteNote: notesState.deleteNote,
    exportLiveNotesAsCSV: notesState.exportLiveNotesAsCSV
  };

  return (
    <NotesContext.Provider value={contextValue}>
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
