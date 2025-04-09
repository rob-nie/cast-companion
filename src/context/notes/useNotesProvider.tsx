
import { useState, useEffect } from "react";
import { useProjects } from "../ProjectContext";
import { useUser } from "../UserContext";
import { Note } from "./types";
import { createCSVFromNotes } from "./notesUtils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useNotesProvider = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const { currentProject } = useProjects();
  const { user } = useUser();
  const [interviewNotes, setInterviewNotes] = useState<Note | null>(null);
  const [liveNotes, setLiveNotes] = useState<Note[]>([]);

  // User ID for the current user
  const currentUserId = user?.id || "";

  // Load notes for a specific project
  const loadNotes = async (projectId: string): Promise<Note[]> => {
    if (!user?.id) return [];
    
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error("Error loading notes:", error);
        toast.error("Fehler beim Laden der Notizen");
        return [];
      }
      
      if (data) {
        const notesList = data.map(note => ({
          id: note.id,
          content: note.content,
          userId: note.user_id,
          projectId: note.project_id,
          isLiveNote: note.is_live_note,
          stopwatchTime: note.stopwatch_time || 0,
          timestamp: new Date(note.created_at || new Date()),
        }));
        
        setNotes(prev => {
          // Merge with existing notes, replacing those for this project
          const otherNotes = prev.filter(n => n.projectId !== projectId);
          return [...otherNotes, ...notesList];
        });
        
        return notesList;
      }
      
      return [];
    } catch (error) {
      console.error("Error loading notes:", error);
      return [];
    }
  };

  // Optimized notes query
  useEffect(() => {
    if (!user?.id || !currentProject?.id) return;
    
    loadNotes(currentProject.id).catch(console.error);
    
  }, [currentProject?.id, user?.id]);

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

  const addNote = async (note: Omit<Note, "id" | "timestamp" | "userId">): Promise<Note | undefined> => {
    if (!user?.id) {
      throw new Error("User not authenticated");
    }
    
    try {
      const { data, error } = await supabase
        .from('notes')
        .insert({
          content: note.content,
          project_id: note.projectId,
          user_id: currentUserId,
          is_live_note: note.isLiveNote,
          stopwatch_time: note.stopwatchTime || 0
        })
        .select()
        .single();
        
      if (error) {
        console.error("Error adding note:", error);
        toast.error("Notiz konnte nicht gespeichert werden");
        throw error;
      }
      
      if (data) {
        const newNote: Note = {
          id: data.id,
          content: data.content,
          userId: data.user_id,
          projectId: data.project_id,
          isLiveNote: data.is_live_note,
          stopwatchTime: data.stopwatch_time || 0,
          timestamp: new Date(data.created_at || new Date()),
        };
        
        // Update local state
        setNotes(prev => [...prev, newNote]);
        
        return newNote;
      }
    } catch (error) {
      console.error("Error in addNote:", error);
      throw error;
    }
  };

  const updateNote = async (id: string, updates: Partial<Omit<Note, "id" | "userId">>): Promise<void> => {
    try {
      // Prepare data for Supabase
      const updateData: Record<string, any> = {};
      
      if (updates.content !== undefined) updateData.content = updates.content;
      if (updates.isLiveNote !== undefined) updateData.is_live_note = updates.isLiveNote;
      if (updates.projectId !== undefined) updateData.project_id = updates.projectId;
      if (updates.stopwatchTime !== undefined) updateData.stopwatch_time = updates.stopwatchTime;
      
      const { error } = await supabase
        .from('notes')
        .update(updateData)
        .eq('id', id);
        
      if (error) {
        console.error("Error updating note:", error);
        toast.error("Notiz konnte nicht aktualisiert werden");
        throw error;
      }
      
      // Update local state
      setNotes(prev => prev.map(note => 
        note.id === id ? { ...note, ...updates } : note
      ));
    } catch (error) {
      console.error("Error in updateNote:", error);
      throw error;
    }
  };
  
  const deleteNote = async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id);
        
      if (error) {
        console.error("Error deleting note:", error);
        toast.error("Notiz konnte nicht gelöscht werden");
        throw error;
      }
      
      // Update local state
      setNotes(prev => prev.filter(note => note.id !== id));
    } catch (error) {
      console.error("Error in deleteNote:", error);
      throw error;
    }
  };

  const exportLiveNotesAsCSV = (projectId: string) => {
    // Filter notes by project ID and current user ID
    const projectNotes = notes.filter(
      (note) => note.projectId === projectId && 
               note.userId === currentUserId && 
               note.isLiveNote
    );
    
    return createCSVFromNotes(projectNotes);
  };

  return {
    notes,
    interviewNotes,
    liveNotes,
    addNote,
    updateNote,
    deleteNote,
    exportLiveNotesAsCSV,
    loadNotes
  };
};
