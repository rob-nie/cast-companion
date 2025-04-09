
import { useState, useEffect } from "react";
import { useProjects } from "../ProjectContext";
import { useUser } from "../UserContext";
import { Message, QuickPhrase } from "@/types/messenger";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const useMessagesProvider = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [quickPhrases, setQuickPhrases] = useState<QuickPhrase[]>([]);
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
  const { currentProject } = useProjects();
  const { user } = useUser();
  
  // Fetch messages for the current project
  useEffect(() => {
    if (!user?.id || !currentProject?.id) return;
    
    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('project_id', currentProject.id)
          .order('created_at', { ascending: true });
          
        if (error) {
          console.error("Error fetching messages:", error);
          toast.error("Fehler beim Laden der Nachrichten");
          return;
        }
        
        if (data) {
          const messagesList: Message[] = data.map(msg => ({
            id: msg.id,
            content: msg.content,
            sender: msg.sender,
            recipient: msg.recipient || undefined,
            projectId: msg.project_id,
            isRead: msg.is_read || false,
            isImportant: msg.is_important || false,
            timestamp: new Date(msg.created_at || new Date())
          }));
          
          setMessages(prev => {
            // Replace messages for this project
            const otherMessages = prev.filter(m => m.projectId !== currentProject.id);
            return [...otherMessages, ...messagesList];
          });
        }
      } catch (err) {
        console.error("Error in fetchMessages:", err);
      }
    };
    
    fetchMessages();
    
    // Set up real-time subscription for new messages
    const channel = supabase
      .channel('public:messages')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'messages',
          filter: `project_id=eq.${currentProject.id}` 
        }, 
        (payload) => {
          fetchMessages(); // Refresh messages when changes occur
        })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentProject?.id, user?.id]);
  
  // Fetch quick phrases for the current user
  useEffect(() => {
    if (!user?.id) return;
    
    const fetchQuickPhrases = async () => {
      try {
        const { data, error } = await supabase
          .from('quick_phrases')
          .select('*')
          .eq('user_id', user.id);
          
        if (error) {
          console.error("Error fetching quick phrases:", error);
          return;
        }
        
        if (data) {
          const phrasesList: QuickPhrase[] = data.map(phrase => ({
            id: phrase.id,
            content: phrase.content,
            userId: phrase.user_id
          }));
          
          setQuickPhrases(phrasesList);
        }
      } catch (err) {
        console.error("Error in fetchQuickPhrases:", err);
      }
    };
    
    fetchQuickPhrases();
    
    // Set up real-time subscription for quick phrases
    const channel = supabase
      .channel('public:quick_phrases')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'quick_phrases',
          filter: `user_id=eq.${user.id}` 
        }, 
        (payload) => {
          fetchQuickPhrases(); // Refresh phrases when changes occur
        })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Update current messages when the project changes
  useEffect(() => {
    if (currentProject) {
      setCurrentMessages(
        messages.filter(message => message.projectId === currentProject.id)
          .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      );
    } else {
      setCurrentMessages([]);
    }
  }, [currentProject, messages]);

  const addMessage = async (message: Omit<Message, "id" | "timestamp" | "isRead">) => {
    if (!user?.id) return;
    
    const currentUserId = user.id;
    
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          content: message.content,
          sender: message.sender,
          recipient: message.recipient,
          project_id: message.projectId,
          is_important: message.isImportant || false,
          is_read: message.sender === currentUserId // Messages from current user are automatically read
        });
        
      if (error) {
        console.error("Error adding message:", error);
        toast.error("Nachricht konnte nicht gesendet werden");
      }
    } catch (err) {
      console.error("Error in addMessage:", err);
      toast.error("Nachricht konnte nicht gesendet werden");
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', id);
        
      if (error) {
        console.error("Error marking message as read:", error);
      }
    } catch (err) {
      console.error("Error in markAsRead:", err);
    }
  };

  const toggleImportant = async (id: string) => {
    try {
      // First get current importance state
      const message = messages.find(m => m.id === id);
      if (!message) return;
      
      const { error } = await supabase
        .from('messages')
        .update({ is_important: !message.isImportant })
        .eq('id', id);
        
      if (error) {
        console.error("Error toggling message importance:", error);
        toast.error("Wichtiger Status konnte nicht geändert werden");
      }
    } catch (err) {
      console.error("Error in toggleImportant:", err);
      toast.error("Wichtiger Status konnte nicht geändert werden");
    }
  };

  const addQuickPhrase = async (content: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('quick_phrases')
        .insert({ content, user_id: userId });
        
      if (error) {
        console.error("Error adding quick phrase:", error);
        toast.error("Quick Phrase konnte nicht hinzugefügt werden");
      }
    } catch (err) {
      console.error("Error in addQuickPhrase:", err);
      toast.error("Quick Phrase konnte nicht hinzugefügt werden");
    }
  };

  const updateQuickPhrase = async (id: string, content: string) => {
    try {
      const { error } = await supabase
        .from('quick_phrases')
        .update({ content })
        .eq('id', id);
        
      if (error) {
        console.error("Error updating quick phrase:", error);
        toast.error("Quick Phrase konnte nicht aktualisiert werden");
      }
    } catch (err) {
      console.error("Error in updateQuickPhrase:", err);
      toast.error("Quick Phrase konnte nicht aktualisiert werden");
    }
  };

  const deleteQuickPhrase = async (id: string) => {
    try {
      const { error } = await supabase
        .from('quick_phrases')
        .delete()
        .eq('id', id);
        
      if (error) {
        console.error("Error deleting quick phrase:", error);
        toast.error("Quick Phrase konnte nicht gelöscht werden");
      }
    } catch (err) {
      console.error("Error in deleteQuickPhrase:", err);
      toast.error("Quick Phrase konnte nicht gelöscht werden");
    }
  };

  const getQuickPhrasesForUser = (userId: string) => {
    return quickPhrases.filter(phrase => phrase.userId === userId);
  };

  // Add this function to get messages for a specific project
  const getMessagesForProject = (projectId: string): Message[] => {
    return messages.filter(message => message.projectId === projectId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  };

  return {
    messages,
    quickPhrases,
    currentMessages,
    addMessage,
    markAsRead,
    toggleImportant,
    addQuickPhrase,
    updateQuickPhrase,
    deleteQuickPhrase,
    getQuickPhrasesForUser,
    getMessagesForProject
  };
};
