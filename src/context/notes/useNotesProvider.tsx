
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

  // Load notes for a specific project
  const loadNotes = async (projectId: string): Promise<Note[]> => {
    if (!user?.id) return [];
    
    try {
      const notesRef = fetchNotes(currentUserId, projectId);
      return new Promise((resolve) => {
        const unsubscribe = onValue(notesRef, (snapshot) => {
          unsubscribe(); // Unsubscribe after first load
          
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
            
            setNotes(prev => {
              // Merge with existing notes, replacing those for this project
              const otherNotes = prev.filter(n => n.projectId !== projectId);
              return [...otherNotes, ...notesList];
            });
            resolve(notesList);
          } else {
            resolve([]);
          }
        });
      });
    } catch (error) {
      console.error("Error loading notes:", error);
      return [];
    }
  };

  // Optimized notes query
  useEffect(() => {
    if (!user?.id || !currentProject?.id) return;
    
    loadNotes(currentProject.id).catch(console.error);
    
  }, [currentProject?.id, user?.id]);

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

  const addNote = async (note: Omit<Note, "id" | "timestamp" | "userId">): Promise<Note> => {
    const { promise, noteId } = addNewNote(note, currentUserId);
    
    const newNote: Note = {
      ...note,
      id: noteId,
      userId: currentUserId,
      timestamp: new Date(),
    };
    
    await promise.catch((error) => {
      console.error("Error adding note:", error);
    });
    
    return newNote;
  };

  const updateNote = async (id: string, updates: Partial<Omit<Note, "id" | "userId">>): Promise<void> => {
    // Prepare data for Firebase
    const updateData: Record<string, any> = { ...updates };
    
    // Convert Date objects to ISO strings for Firebase
    if (updateData.timestamp instanceof Date) {
      updateData.timestamp = updateData.timestamp.toISOString();
    }
    
    await updateExistingNote(id, updateData);
  };
  
  const deleteNote = async (id: string): Promise<void> => {
    await deleteExistingNote(id);
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
    loadNotes
  };
};
