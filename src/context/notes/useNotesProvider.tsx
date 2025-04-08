
import { useState, useEffect } from "react";
import { onValue } from "firebase/database";
import { useProjects } from "../ProjectContext";
import { useUser } from "../UserContext";
import { Note } from "./types";
import { fetchNotes, addNewNote, updateExistingNote, deleteExistingNote } from "./notesService";
import { createCSVFromNotes } from "./notesUtils";

export const useNotesProvider = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const { currentProject } = useProjects();
  const { user } = useUser();
  const [interviewNotes, setInterviewNotes] = useState<Note | null>(null);
  const [liveNotes, setLiveNotes] = useState<Note[]>([]);

  // User ID for the current user
  const currentUserId = user?.id || "user-1";

  // Optimized notes query
  useEffect(() => {
    if (!user?.id) return;
    
    const notesRef = fetchNotes(currentUserId, currentProject?.id);
    
    const unsubscribe = onValue(notesRef, (snapshot) => {
      if (snapshot.exists()) {
        const notesData = snapshot.val();
        const notesList: Note[] = [];
        
        Object.keys(notesData).forEach((key) => {
          const note = notesData[key];
          notesList.push({
            ...note,
            id: key,
            timestamp: note.timestamp ? new Date(note.timestamp) : undefined,
          });
        });
        
        setNotes(notesList);
      } else {
        setNotes([]);
      }
    });
    
    return () => unsubscribe();
  }, [currentProject, currentUserId, user?.id]);

  // Update the current notes when the selected project or user changes
  useEffect(() => {
    if (currentProject) {
      // Find the interview notes for the current project and user
      const projectInterviewNotes = notes.find(
        (note) => note.projectId === currentProject.id && 
                 note.userId === currentUserId && 
                 !note.isLiveNote
      ) || null;
      
      // Find all live notes for the current project and user
      const projectLiveNotes = notes.filter(
        (note) => note.projectId === currentProject.id && 
                 note.userId === currentUserId && 
                 note.isLiveNote
      );
      
      setInterviewNotes(projectInterviewNotes);
      setLiveNotes(projectLiveNotes);
    } else {
      setInterviewNotes(null);
      setLiveNotes([]);
    }
  }, [currentProject, notes, currentUserId]);

  const addNote = (note: Omit<Note, "id" | "timestamp" | "userId">) => {
    const { promise, noteId } = addNewNote(note, currentUserId);
    
    const newNote: Note = {
      ...note,
      id: noteId,
      userId: currentUserId,
      timestamp: new Date(),
    };
    
    promise.catch((error) => {
      console.error("Error adding note:", error);
    });
    
    return newNote;
  };

  const updateNote = (id: string, updates: Partial<Omit<Note, "id" | "userId">>) => {
    // Prepare data for Firebase
    const updateData: Record<string, any> = { ...updates };
    
    // Convert Date objects to ISO strings for Firebase
    if (updateData.timestamp instanceof Date) {
      updateData.timestamp = updateData.timestamp.toISOString();
    }
    
    updateExistingNote(id, updateData)
      .catch((error) => {
        console.error("Error updating note:", error);
      });
  };
  
  const deleteNote = (id: string) => {
    deleteExistingNote(id)
      .catch((error) => {
        console.error("Error deleting note:", error);
      });
  };

  const exportLiveNotesAsCSV = (projectId: string) => {
    // Filter notes by project ID and current user ID
    const projectNotes = notes.filter(
      (note) => note.projectId === projectId && 
               note.userId === currentUserId && 
               note.isLiveNote
    );
    
    return createCSVFromNotes(projectNotes);
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
