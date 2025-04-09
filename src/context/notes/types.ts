
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
  addNote: (note: Omit<Note, "id" | "timestamp" | "userId">) => Promise<Note>;
  updateNote: (id: string, updates: Partial<Omit<Note, "id" | "userId">>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  exportLiveNotesAsCSV: (projectId: string) => string;
  loadNotes?: (projectId: string) => Promise<Note[]>; // Adding loadNotes as optional
};
