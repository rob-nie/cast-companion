
import { ref, push, update, remove, query, orderByChild, equalTo, limitToLast, set } from "firebase/database";
import { database, QUERY_LIMIT } from "@/lib/firebase";
import { Note } from "./types";

export const fetchNotes = (userId: string, projectId?: string) => {
  // Load only notes for the current user, with project filter if available
  return projectId
    ? query(
        ref(database, 'notes'),
        orderByChild('projectId'),
        equalTo(projectId),
        limitToLast(QUERY_LIMIT)
      )
    : query(
        ref(database, 'notes'),
        orderByChild('userId'),
        equalTo(userId),
        limitToLast(QUERY_LIMIT)
      );
};

export const addNewNote = (note: Omit<Note, "id" | "timestamp" | "userId">, userId: string) => {
  const newNoteRef = push(ref(database, 'notes'));
  
  // Prepare for Firebase
  const firebaseNote = {
    ...note,
    userId,
    timestamp: new Date().toISOString(),
  };
  
  // Return a promise for the set operation
  return {
    promise: set(newNoteRef, firebaseNote),
    noteId: newNoteRef.key!,
  };
};

export const updateExistingNote = (id: string, updates: Record<string, any>) => {
  const noteRef = ref(database, `notes/${id}`);
  return update(noteRef, updates);
};

export const deleteExistingNote = (id: string) => {
  const noteRef = ref(database, `notes/${id}`);
  return remove(noteRef);
};
