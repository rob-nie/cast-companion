
import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useProjects } from "./ProjectContext";
import { useUser } from "./UserContext";
import { Message, QuickPhrase } from "@/types/messenger";
import { ref, push, update, remove, onValue, query, orderByChild, limitToLast, equalTo } from "firebase/database";
import { database, QUERY_LIMIT } from "@/lib/firebase";
import { toast } from "sonner";

type MessagesContextType = {
  messages: Message[];
  quickPhrases: QuickPhrase[];
  currentMessages: Message[];
  addMessage: (message: Omit<Message, "id" | "timestamp" | "isRead">) => void;
  markAsRead: (id: string) => void;
  toggleImportant: (id: string) => void;
  addQuickPhrase: (content: string, userId: string) => void;
  updateQuickPhrase: (id: string, content: string) => void;
  deleteQuickPhrase: (id: string) => void;
  getQuickPhrasesForUser: (userId: string) => QuickPhrase[];
};

const MessagesContext = createContext<MessagesContextType | undefined>(undefined);

export const MessagesProvider = ({ children }: { children: ReactNode }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [quickPhrases, setQuickPhrases] = useState<QuickPhrase[]>([]);
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
  const { currentProject } = useProjects();
  const { user } = useUser();
  
  // Optimized query with filtering and pagination
  useEffect(() => {
    if (!user?.id || !currentProject?.id) return;
    
    // Using the added indexOn for projectId
    const messagesRef = query(
      ref(database, 'messages'),
      orderByChild('projectId'),
      equalTo(currentProject.id),
      limitToLast(QUERY_LIMIT)
    );
        
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
  
  // Optimized query for QuickPhrases using new index
  useEffect(() => {
    if (!user?.id) return;
    
    // Using the newly added indexOn for userId
    const quickPhrasesRef = query(
      ref(database, 'quickPhrases'),
      orderByChild('userId'),
      equalTo(user.id),
      limitToLast(QUERY_LIMIT)
    );
    
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
    try {
      const newMessageRef = push(ref(database, 'messages'));
      const currentUserId = user?.id || "user-1";
      
      const newMessage = {
        ...message,
        timestamp: new Date().toISOString(),
        isRead: message.sender === currentUserId, // Messages from current user are automatically read
      };
      
      push(ref(database, 'messages'), newMessage)
        .catch((error) => {
          console.error("Error adding message:", error);
          toast.error("Nachricht konnte nicht gesendet werden");
        });
    } catch (error) {
      console.error("Error in addMessage:", error);
      toast.error("Nachricht konnte nicht gesendet werden");
    }
  };

  const markAsRead = (id: string) => {
    try {
      const messageRef = ref(database, `messages/${id}`);
      update(messageRef, { isRead: true })
        .catch((error) => {
          console.error("Error marking message as read:", error);
        });
    } catch (error) {
      console.error("Error in markAsRead:", error);
    }
  };

  const toggleImportant = (id: string) => {
    try {
      // First get current importance state
      const message = messages.find(m => m.id === id);
      if (!message) return;
      
      const messageRef = ref(database, `messages/${id}`);
      update(messageRef, { isImportant: !message.isImportant })
        .catch((error) => {
          console.error("Error toggling message importance:", error);
          toast.error("Wichtiger Status konnte nicht geändert werden");
        });
    } catch (error) {
      console.error("Error in toggleImportant:", error);
      toast.error("Wichtiger Status konnte nicht geändert werden");
    }
  };

  const addQuickPhrase = (content: string, userId: string) => {
    try {
      const newQuickPhrase = {
        userId,
        content,
      };
      
      push(ref(database, 'quickPhrases'), newQuickPhrase)
        .catch((error) => {
          console.error("Error adding quick phrase:", error);
          toast.error("Quick Phrase konnte nicht hinzugefügt werden");
        });
    } catch (error) {
      console.error("Error in addQuickPhrase:", error);
      toast.error("Quick Phrase konnte nicht hinzugefügt werden");
    }
  };

  const updateQuickPhrase = (id: string, content: string) => {
    try {
      const phraseRef = ref(database, `quickPhrases/${id}`);
      update(phraseRef, { content })
        .catch((error) => {
          console.error("Error updating quick phrase:", error);
          toast.error("Quick Phrase konnte nicht aktualisiert werden");
        });
    } catch (error) {
      console.error("Error in updateQuickPhrase:", error);
      toast.error("Quick Phrase konnte nicht aktualisiert werden");
    }
  };

  const deleteQuickPhrase = (id: string) => {
    try {
      const phraseRef = ref(database, `quickPhrases/${id}`);
      remove(phraseRef)
        .catch((error) => {
          console.error("Error deleting quick phrase:", error);
          toast.error("Quick Phrase konnte nicht gelöscht werden");
        });
    } catch (error) {
      console.error("Error in deleteQuickPhrase:", error);
      toast.error("Quick Phrase konnte nicht gelöscht werden");
    }
  };

  const getQuickPhrasesForUser = (userId: string) => {
    return quickPhrases.filter(phrase => phrase.userId === userId);
  };

  return (
    <MessagesContext.Provider
      value={{
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
      }}
    >
      {children}
    </MessagesContext.Provider>
  );
};

export const useMessages = () => {
  const context = useContext(MessagesContext);
  if (context === undefined) {
    throw new Error("useMessages must be used within a MessagesProvider");
  }
  return context;
};
