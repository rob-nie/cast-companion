import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useProjects } from "./ProjectContext";

export type Note = {
  id: string;
  projectId: string;
  content: string;
  timestamp?: Date;
  stopwatchTime?: number;
  isLiveNote: boolean;
};

type NotesContextType = {
  notes: Note[];
  interviewNotes: Note | null;
  liveNotes: Note[];
  addNote: (note: Omit<Note, "id" | "timestamp">) => Note;
  updateNote: (id: string, updates: Partial<Omit<Note, "id">>) => void;
  deleteNote: (id: string) => void;
  exportLiveNotesAsCSV: (projectId: string) => string;
};

const NotesContext = createContext<NotesContextType | undefined>(undefined);

// Sample data
const initialNotes: Note[] = [
  {
    id: "note-1",
    projectId: "1",
    content: "<h1>Projekt: Website Redesign</h1><p>Interview mit dem Projektleiter</p><p>Der Kunde wünscht sich eine moderne Gestaltung mit Fokus auf Benutzerfreundlichkeit.</p>",
    isLiveNote: false,
  },
  {
    id: "note-2",
    projectId: "1",
    content: "Kunde betont Wichtigkeit der mobilen Ansicht",
    timestamp: new Date("2024-06-10T10:05:30"),
    stopwatchTime: 305, // 5:05
    isLiveNote: true,
  },
  {
    id: "note-3",
    projectId: "1",
    content: "Budget: 15.000-20.000 €",
    timestamp: new Date("2024-06-10T10:12:45"),
    stopwatchTime: 765, // 12:45
    isLiveNote: true,
  },
  {
    id: "note-4",
    projectId: "2",
    content: "<h1>Mobile App Entwicklung</h1><p>Kundengespräch zu Anforderungen</p>",
    isLiveNote: false,
  }
];

export const NotesProvider = ({ children }: { children: ReactNode }) => {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const { currentProject } = useProjects();
  const [interviewNotes, setInterviewNotes] = useState<Note | null>(null);
  const [liveNotes, setLiveNotes] = useState<Note[]>([]);

  // Update the current notes when the selected project changes
  useEffect(() => {
    if (currentProject) {
      // Find the interview notes for the current project
      const projectInterviewNotes = notes.find(
        (note) => note.projectId === currentProject.id && !note.isLiveNote
      ) || null;
      
      // Find all live notes for the current project
      const projectLiveNotes = notes.filter(
        (note) => note.projectId === currentProject.id && note.isLiveNote
      );
      
      setInterviewNotes(projectInterviewNotes);
      setLiveNotes(projectLiveNotes);
    } else {
      setInterviewNotes(null);
      setLiveNotes([]);
    }
  }, [currentProject, notes]);

  const addNote = (note: Omit<Note, "id" | "timestamp">) => {
    const newNote: Note = {
      ...note,
      id: Date.now().toString(),
      timestamp: new Date(),
    };
    
    setNotes((prev) => [...prev, newNote]);
    return newNote;
  };

  const updateNote = (id: string, updates: Partial<Omit<Note, "id">>) => {
    setNotes((prev) =>
      prev.map((note) =>
        note.id === id ? { ...note, ...updates } : note
      )
    );
  };
  
  const deleteNote = (id: string) => {
    setNotes((prev) => prev.filter((note) => note.id !== id));
  };

  const exportLiveNotesAsCSV = (projectId: string) => {
    
    const projectNotes = notes.filter(
      (note) => note.projectId === projectId && note.isLiveNote
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
