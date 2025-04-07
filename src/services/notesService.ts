
import { ref, push, update, remove, onValue, set } from "firebase/database";
import { database } from "@/lib/firebase";
import { Note } from "@/types/note";

// Subscribe to all notes from Firebase
export const subscribeToNotes = (callback: (notes: Note[]) => void) => {
  try {
    const notesRef = ref(database, 'notes');
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
        
        callback(notesList);
      } else {
        callback([]);
      }
    });
    
    return unsubscribe;
  } catch (error) {
    console.error("Failed to load notes:", error);
    callback([]);
    return () => {};
  }
};

// Add a new note to Firebase
export const addNoteToFirebase = async (note: Omit<Note, "id" | "timestamp" | "userId">, userId: string) => {
  try {
    const newNoteRef = push(ref(database, 'notes'));
    const firebaseNote = {
      ...note,
      userId,
      timestamp: new Date().toISOString(),
    };
    
    await set(newNoteRef, firebaseNote);
    
    return {
      ...note,
      id: newNoteRef.key!,
      userId,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error("Error adding note:", error);
    throw error;
  }
};

// Update an existing note in Firebase
export const updateNoteInFirebase = async (id: string, updates: Partial<Omit<Note, "id" | "userId">>) => {
  try {
    const updateData: Record<string, any> = { ...updates };
    
    // Convert Date objects to ISO strings for Firebase
    if (updateData.timestamp instanceof Date) {
      updateData.timestamp = updateData.timestamp.toISOString();
    }
    
    const noteRef = ref(database, `notes/${id}`);
    await update(noteRef, updateData);
    return true;
  } catch (error) {
    console.error("Error updating note:", error);
    throw error;
  }
};

// Delete a note from Firebase
export const deleteNoteFromFirebase = async (id: string) => {
  try {
    const noteRef = ref(database, `notes/${id}`);
    await remove(noteRef);
    return true;
  } catch (error) {
    console.error("Error deleting note:", error);
    throw error;
  }
};

// Format time in mm:ss format
export const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Export notes to CSV format
export const exportNotesToCSV = (notes: Note[], projectId: string, userId: string) => {
  // Filter notes by project ID and user ID
  const projectNotes = notes.filter(
    (note) => note.projectId === projectId && 
              note.userId === userId && 
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
