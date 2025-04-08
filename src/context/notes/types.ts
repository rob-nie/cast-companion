
export type Note = {
  id: string;
  projectId: string;
  userId: string;
  content: string;
  timestamp?: Date;
  stopwatchTime?: number;
  isLiveNote: boolean;
};

export type NotesContextType = {
  notes: Note[];
  interviewNotes: Note | null;
  liveNotes: Note[];
  addNote: (note: Omit<Note, "id" | "timestamp" | "userId">) => Note;
  updateNote: (id: string, updates: Partial<Omit<Note, "id" | "userId">>) => void;
  deleteNote: (id: string) => void;
  exportLiveNotesAsCSV: (projectId: string) => string;
};
