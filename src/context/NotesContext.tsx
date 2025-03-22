
import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useProjects } from "./ProjectContext";

export type Note = {
  id: string;
  projectId: string;
  content: string;
  timestamp?: Date;
  stopwatchTime?: number; // Time in milliseconds
  isLiveNote: boolean;
};

type NotesContextType = {
  notes: Note[];
  interviewNotes: Note | null;
  liveNotes: Note[];
  addNote: (note: Omit<Note, "id">) => void;
  updateNote: (id: string, note: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  getNotesForProject: (projectId: string, isLive?: boolean) => Note[];
  exportLiveNotesAsCSV: (projectId: string) => string;
};

const NotesContext = createContext<NotesContextType | undefined>(undefined);

// Sample interview notes with rich content
const initialNotes: Note[] = [
  {
    id: "int-1",
    projectId: "1",
    content: "<h1>Bewerbungsgespräch - Entwickler Position</h1><p>Fragen für das Interview:</p><ul><li>Bisherige Erfahrungen mit React und TypeScript</li><li>Team-Erfahrung und agiles Arbeiten</li><li>Problem-Lösungsansätze</li></ul><p>Wichtig zu erwähnen: Probezeit 6 Monate, Gehaltsspanne 60-75k</p>",
    isLiveNote: false,
  },
  {
    id: "live-1",
    projectId: "1",
    content: "Kandidat kommt aus der Fintech-Branche",
    timestamp: new Date("2024-06-10T10:05:30"),
    stopwatchTime: 300500, // 5:00.5 minutes
    isLiveNote: true,
  },
  {
    id: "live-2",
    projectId: "1", 
    content: "Sehr gute Kenntnisse in React, hat an großen Projekten gearbeitet",
    timestamp: new Date("2024-06-10T10:10:15"),
    stopwatchTime: 600200, // 10:00.2 minutes
    isLiveNote: true,
  },
  {
    id: "int-2",
    projectId: "2",
    content: "<h1>Kundenprojekt - Anforderungsanalyse</h1><p>Agenda:</p><ol><li>Vorstellung des Teams</li><li>Projektumfang besprechen</li><li>Zeitlicher Rahmen</li><li>Budget</li><li>Nächste Schritte</li></ol>",
    isLiveNote: false,
  }
];

export const NotesProvider = ({ children }: { children: ReactNode }) => {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const { currentProject } = useProjects();
  const [interviewNotes, setInterviewNotes] = useState<Note | null>(null);
  const [liveNotes, setLiveNotes] = useState<Note[]>([]);

  // Update live and interview notes when currentProject changes
  useEffect(() => {
    if (currentProject) {
      const projectNotes = notes.filter(note => note.projectId === currentProject.id);
      setInterviewNotes(projectNotes.find(note => !note.isLiveNote) || null);
      setLiveNotes(projectNotes.filter(note => note.isLiveNote));
    } else {
      setInterviewNotes(null);
      setLiveNotes([]);
    }
  }, [currentProject, notes]);

  const addNote = (note: Omit<Note, "id">) => {
    const newNote = {
      ...note,
      id: Date.now().toString(),
    };
    setNotes((prev) => [...prev, newNote]);
  };

  const updateNote = (id: string, noteUpdate: Partial<Note>) => {
    setNotes((prev) =>
      prev.map((note) =>
        note.id === id ? { ...note, ...noteUpdate } : note
      )
    );
  };

  const deleteNote = (id: string) => {
    setNotes((prev) => prev.filter((note) => note.id !== id));
  };

  const getNotesForProject = (projectId: string, isLive?: boolean) => {
    if (isLive !== undefined) {
      return notes.filter(note => note.projectId === projectId && note.isLiveNote === isLive);
    }
    return notes.filter(note => note.projectId === projectId);
  };

  const exportLiveNotesAsCSV = (projectId: string) => {
    const projectLiveNotes = notes.filter(note => note.projectId === projectId && note.isLiveNote);
    
    // Sort by stopwatch time
    projectLiveNotes.sort((a, b) => (a.stopwatchTime || 0) - (b.stopwatchTime || 0));
    
    // Format CSV header
    let csv = "Timestamp,Stopwatch,Content\n";
    
    // Add each note
    projectLiveNotes.forEach(note => {
      const timestamp = note.timestamp ? note.timestamp.toISOString() : "";
      
      // Format stopwatch time as mm:ss.ms
      let stopwatchFormatted = "";
      if (note.stopwatchTime !== undefined) {
        const ms = note.stopwatchTime % 1000;
        const totalSeconds = Math.floor(note.stopwatchTime / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        stopwatchFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
      }
      
      // Escape content for CSV (replace commas, quotes, newlines)
      const escapedContent = note.content.replace(/"/g, '""').replace(/\n/g, ' ');
      
      csv += `"${timestamp}","${stopwatchFormatted}","${escapedContent}"\n`;
    });
    
    return csv;
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
        getNotesForProject,
        exportLiveNotesAsCSV,
      }}
    >
      {children}
    </NotesContext.Provider>
  );
};

export const useNotes = () => {
  const context = useContext(NotesContext);
  if (context === undefined) {
    throw new Error("useNotes must be used within a NotesProvider");
  }
  return context;
};
