
// This file is kept for reference but is no longer used.
// All Firebase functionality has been migrated to Supabase.

import { toast } from "sonner";

export const getMessagesRef = (projectId: string) => {
  // Legacy reference
  return null;
};

export const getQuickPhrasesRef = (userId: string) => {
  // Legacy reference
  return null;
};

export const addMessageToFirebase = (message: any, currentUserId: string) => {
  console.warn("Firebase is no longer used. Use Supabase instead.");
  return Promise.resolve();
};

export const markMessageAsReadInFirebase = (id: string) => {
  console.warn("Firebase is no longer used. Use Supabase instead.");
  return Promise.resolve();
};

export const toggleMessageImportanceInFirebase = (id: string, currentImportance: boolean) => {
  console.warn("Firebase is no longer used. Use Supabase instead.");
  return Promise.resolve();
};

export const addQuickPhraseToFirebase = (content: string, userId: string) => {
  console.warn("Firebase is no longer used. Use Supabase instead.");
  return Promise.resolve();
};

export const updateQuickPhraseInFirebase = (id: string, content: string) => {
  console.warn("Firebase is no longer used. Use Supabase instead.");
  return Promise.resolve();
};

export const deleteQuickPhraseFromFirebase = (id: string) => {
  console.warn("Firebase is no longer used. Use Supabase instead.");
  return Promise.resolve();
};
