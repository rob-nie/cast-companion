
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useProjects } from "./ProjectContext";
import { useAuth } from "./AuthContext";
import { ref, push, update, remove, onValue, set } from "firebase/database";
import { database } from "@/lib/firebase";

export type Note = {
  id: string;
  projectId: string;
  userId: string;
  content: string;
  timestamp?: Date;
  stopwatchTime?: number;
  isLiveNote: boolean;
};

type NotesContextType = {
  notes: Note[];
  interviewNotes: Note | null;
  liveNotes: Note[];
  addNote: (note: Omit<Note, "id" | "timestamp" | "userId">) => Note;
  updateNote: (id: string, updates: Partial<Omit<Note, "id" | "userId">>) => void;
  deleteNote: (id: string) => void;
  exportLiveNotesAsCSV: (projectId: string) => string;
};

const NotesContext = createContext<NotesContextType | undefined>(undefined);

export const NotesProvider = ({ children }: { children: ReactNode }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const { currentProject } = useProjects();
  const { user } = useAuth();
  const [interviewNotes, setInterviewNotes] = useState<Note | null>(null);
  const [liveNotes, setLiveNotes] = useState<Note[]>([]);

  // User ID for the current user
  const currentUserId = user?.id || "user-1";

  // Load notes from Firebase
  useEffect(() => {
    let unsubscribe = () => {};
    
    const loadNotes = async () => {
      try {
        const notesRef = ref(database, 'notes');
        unsubscribe = onValue(notesRef, (snapshot) => {
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
      } catch (error) {
        console.error("Failed to load notes:", error);
        setNotes([]);
      }
    };
    
    loadNotes();
    
    return () => unsubscribe();
  }, []);

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
    const newNoteRef = push(ref(database, 'notes'));
    const newNote: Note = {
      ...note,
      id: newNoteRef.key!,
      userId: currentUserId,
      timestamp: new Date(),
    };
    
    // Prepare for Firebase
    const firebaseNote = {
      ...note,
      userId: currentUserId,
      timestamp: new Date().toISOString(),
    };
    
    set(newNoteRef, firebaseNote)
      .catch((error) => {
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
    
    const noteRef = ref(database, `notes/${id}`);
    update(noteRef, updateData)
      .catch((error) => {
        console.error("Error updating note:", error);
      });
  };
  
  const deleteNote = (id: string) => {
    const noteRef = ref(database, `notes/${id}`);
    remove(noteRef)
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
    
    // Sort by time
    projectNotes.sort((a, b) => {
      const timeA = a.stopwatchTime || 0;
      const timeB = b.stopwatchTime || 0;
      return timeA - timeB;
    });
    
    // CSV header
    let csv = "Timestamp,Content\n";
    
    // Add each note as a row
    projectNotes.forEach((note) => {
      const timestamp = note.stopwatchTime !== undefined 
        ? formatTime(note.stopwatchTime)
        : "";
      
      // Escape quotes in content and wrap in quotes
      const safeContent = `"${note.content.replace(/"/g, '""')}"`;
      
      csv += `${timestamp},${safeContent}\n`;
    });
    
    return csv;
  };
  
  // Helper to format time in mm:ss format
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <NotesContext.Provider
      value={{
        notes,
        interviewNotes,
        liveNotes,
        addNote,
        updateNote,
        deleteNote,
        exportLiveNotesAsCSV,
      }}
    >
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
