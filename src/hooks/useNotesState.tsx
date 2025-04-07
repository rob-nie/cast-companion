
import { useState, useEffect, useCallback } from "react";
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

  // Create a callback function for updating notes when the project changes
  const updateCurrentProjectNotes = useCallback((currentProjectId: string | undefined) => {
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
  }, [notes, currentUserId]);

  // Update current notes whenever the notes array changes
  useEffect(() => {
    // This effect doesn't need to return anything specific
  }, [updateCurrentProjectNotes]);

  const addNote = async (note: Omit<Note, "id" | "timestamp" | "userId">) => {
    return await addNoteToFirebase(note, currentUserId);
  };

  const updateNote = async (id: string, updates: Partial<Omit<Note, "id" | "userId">>) => {
    return await updateNoteInFirebase(id, updates);
  };
  
  const deleteNote = async (id: string) => {
    return await deleteNoteFromFirebase(id);
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
    updateCurrentProjectNotes
  };
};
