
// This file is kept for reference but is no longer used.
// All Firebase functionality has been migrated to Supabase.

import { toast } from "sonner";

export const getNotesRef = (projectId: string) => {
  // Legacy reference
  return null;
};

export const addNoteToFirebase = (note: any) => {
  console.warn("Firebase is no longer used. Use Supabase instead.");
  return Promise.resolve();
};

export const updateNoteInFirebase = (id: string, updates: Partial<any>) => {
  console.warn("Firebase is no longer used. Use Supabase instead.");
  return Promise.resolve();
};

export const deleteNoteFromFirebase = (id: string) => {
  console.warn("Firebase is no longer used. Use Supabase instead.");
  return Promise.resolve();
};
