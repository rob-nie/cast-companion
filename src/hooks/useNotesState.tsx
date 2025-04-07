
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Note } from "@/types/note";
import { 
  subscribeToNotes, 
  addNoteToFirebase, 
  updateNoteInFirebase, 
  deleteNoteFromFirebase,
  exportNotesToCSV
} from "@/services/notesService";

export const useNotesState = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [interviewNotes, setInterviewNotes] = useState<Note | null>(null);
  const [liveNotes, setLiveNotes] = useState<Note[]>([]);
  const { user } = useAuth();
  
  // User ID for the current user
  const currentUserId = user?.id || "user-1";

  // Load notes from Firebase
  useEffect(() => {
    const unsubscribe = subscribeToNotes(setNotes);
    return () => unsubscribe();
  }, []);

  // Update the current notes when the selected project or user changes
  useEffect(() => {
    const updateCurrentProjectNotes = (currentProjectId: string | undefined) => {
      if (currentProjectId) {
        // Find the interview notes for the current project and user
        const projectInterviewNotes = notes.find(
          (note) => note.projectId === currentProjectId && 
                   note.userId === currentUserId && 
                   !note.isLiveNote
        ) || null;
        
        // Find all live notes for the current project and user
        const projectLiveNotes = notes.filter(
          (note) => note.projectId === currentProjectId && 
                   note.userId === currentUserId && 
                   note.isLiveNote
        );
        
        setInterviewNotes(projectInterviewNotes);
        setLiveNotes(projectLiveNotes);
      } else {
        setInterviewNotes(null);
        setLiveNotes([]);
      }
    };
    
    return { updateCurrentProjectNotes };
  }, [notes, currentUserId]);

  const addNote = (note: Omit<Note, "id" | "timestamp" | "userId">) => {
    return addNoteToFirebase(note, currentUserId);
  };

  const updateNote = (id: string, updates: Partial<Omit<Note, "id" | "userId">>) => {
    return updateNoteInFirebase(id, updates);
  };
  
  const deleteNote = (id: string) => {
    return deleteNoteFromFirebase(id);
  };

  const exportLiveNotesAsCSV = (projectId: string) => {
    return exportNotesToCSV(notes, projectId, currentUserId);
  };

  return {
    notes,
    interviewNotes,
    liveNotes,
    addNote,
    updateNote,
    deleteNote,
    exportLiveNotesAsCSV,
  };
};
