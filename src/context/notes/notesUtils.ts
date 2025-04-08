
import { Note } from "./types";

export const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const createCSVFromNotes = (notes: Note[]) => {
  // Sort by time
  const sortedNotes = [...notes].sort((a, b) => {
    const timeA = a.stopwatchTime || 0;
    const timeB = b.stopwatchTime || 0;
    return timeA - timeB;
  });
  
  // CSV header
  let csv = "Timestamp,Content\n";
  
  // Add each note as a row
  sortedNotes.forEach((note) => {
    const timestamp = note.stopwatchTime !== undefined 
      ? formatTime(note.stopwatchTime)
      : "";
    
    // Escape quotes in content and wrap in quotes
    const safeContent = `"${note.content.replace(/"/g, '""')}"`;
    
    csv += `${timestamp},${safeContent}\n`;
  });
  
  return csv;
};
