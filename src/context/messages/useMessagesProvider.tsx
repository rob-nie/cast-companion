
import { useState, useEffect } from "react";
import { useProjects } from "../ProjectContext";
import { useUser } from "../UserContext";
import { Message, QuickPhrase } from "@/types/messenger";
import { onValue } from "firebase/database";
import { toast } from "sonner";
import { 
  getMessagesRef, 
  getQuickPhrasesRef, 
  addMessageToFirebase,
  markMessageAsReadInFirebase,
  toggleMessageImportanceInFirebase,
  addQuickPhraseToFirebase,
  updateQuickPhraseInFirebase,
  deleteQuickPhraseFromFirebase
} from "./messagesService";

export const useMessagesProvider = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [quickPhrases, setQuickPhrases] = useState<QuickPhrase[]>([]);
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
  const { currentProject } = useProjects();
  const { user } = useUser();
  
  // Fetch messages for the current project
  useEffect(() => {
    if (!user?.id || !currentProject?.id) return;
    
    const messagesRef = getMessagesRef(currentProject.id);
        
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      if (snapshot.exists()) {
        const messagesData = snapshot.val();
        const messagesList: Message[] = [];
        
        Object.keys(messagesData).forEach((key) => {
          const message = messagesData[key];
          messagesList.push({
            ...message,
            id: key,
            timestamp: new Date(message.timestamp),
          });
        });
        
        // Sort messages chronologically
        messagesList.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        setMessages(messagesList);
      } else {
        setMessages([]);
      }
    }, error => {
      console.error("Error fetching messages:", error);
      toast.error("Fehler beim Laden der Nachrichten");
    });
    
    return () => unsubscribe();
  }, [currentProject?.id, user?.id]);
  
  // Fetch quick phrases for the current user
  useEffect(() => {
    if (!user?.id) return;
    
    const quickPhrasesRef = getQuickPhrasesRef(user.id);
    
    const unsubscribe = onValue(quickPhrasesRef, (snapshot) => {
      if (snapshot.exists()) {
        const phrasesData = snapshot.val();
        const phrasesList: QuickPhrase[] = [];
        
        Object.keys(phrasesData).forEach((key) => {
          const phrase = phrasesData[key];
          phrasesList.push({
            ...phrase,
            id: key,
          });
        });
        
        setQuickPhrases(phrasesList);
      } else {
        setQuickPhrases([]);
      }
    }, error => {
      console.error("Error fetching quick phrases:", error);
      // Silent error - don't show toast for quick phrases loading issues
    });
    
    return () => unsubscribe();
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

  const addMessage = (message: Omit<Message, "id" | "timestamp" | "isRead">) => {
    const currentUserId = user?.id || "user-1";
    addMessageToFirebase(message, currentUserId);
  };

  const markAsRead = (id: string) => {
    markMessageAsReadInFirebase(id);
  };

  const toggleImportant = (id: string) => {
    // First get current importance state
    const message = messages.find(m => m.id === id);
    if (!message) return;
    
    toggleMessageImportanceInFirebase(id, message.isImportant);
  };

  const addQuickPhrase = (content: string, userId: string) => {
    addQuickPhraseToFirebase(content, userId);
  };

  const updateQuickPhrase = (id: string, content: string) => {
    updateQuickPhraseInFirebase(id, content);
  };

  const deleteQuickPhrase = (id: string) => {
    deleteQuickPhraseFromFirebase(id);
  };

  const getQuickPhrasesForUser = (userId: string) => {
    return quickPhrases.filter(phrase => phrase.userId === userId);
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
  };
};
