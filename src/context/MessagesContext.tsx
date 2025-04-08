
import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useProjects } from "./ProjectContext";
import { useUser } from "./UserContext";
import { Message, QuickPhrase } from "@/types/messenger";
import { ref, push, update, remove, onValue, query, orderByChild, equalTo, set } from "firebase/database";
import { database } from "@/lib/firebase";

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
  
  // Load messages from Firebase
  useEffect(() => {
    const messagesRef = ref(database, 'messages');
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
        
        setMessages(messagesList);
      } else {
        setMessages([]);
      }
    });
    
    return () => unsubscribe();
  }, []);
  
  // Load quick phrases from Firebase
  useEffect(() => {
    const quickPhrasesRef = ref(database, 'quickPhrases');
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
    });
    
    return () => unsubscribe();
  }, []);

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
      console.log("Adding message:", message);
      const currentUserId = user?.id || "user-1";
      const newMessageRef = push(ref(database, 'messages'));
      
      if (!newMessageRef.key) {
        console.error("Failed to generate key for new message");
        return;
      }
      
      const newMessage = {
        ...message,
        timestamp: new Date().toISOString(),
        isRead: message.sender === currentUserId, // Messages from current user are automatically read
      };
      
      // Use set instead of another push
      set(newMessageRef, newMessage)
        .then(() => {
          console.log("Message added successfully with ID:", newMessageRef.key);
        })
        .catch((error) => {
          console.error("Error adding message:", error);
        });
    } catch (error) {
      console.error("Exception when adding message:", error);
    }
  };

  const markAsRead = (id: string) => {
    console.log('MessagesContext: Marking message as read:', id);
    const messageRef = ref(database, `messages/${id}`);
    update(messageRef, { isRead: true })
      .then(() => {
        console.log("Message marked as read successfully:", id);
      })
      .catch((error) => {
        console.error("Error marking message as read:", error);
      });
  };

  const toggleImportant = (id: string) => {
    console.log('MessagesContext: Toggling message importance:', id);
    
    // First get current importance state
    const message = messages.find(m => m.id === id);
    if (!message) return;
    
    const messageRef = ref(database, `messages/${id}`);
    update(messageRef, { isImportant: !message.isImportant })
      .then(() => {
        console.log("Message importance toggled successfully:", id);
      })
      .catch((error) => {
        console.error("Error toggling message importance:", error);
      });
  };

  const addQuickPhrase = (content: string, userId: string) => {
    const newPhraseRef = push(ref(database, 'quickPhrases'));
    const newQuickPhrase = {
      userId,
      content,
    };
    
    // Use set instead of another push
    set(newPhraseRef, newQuickPhrase)
      .then(() => {
        console.log("Quick phrase added successfully");
      })
      .catch((error) => {
        console.error("Error adding quick phrase:", error);
      });
  };

  const updateQuickPhrase = (id: string, content: string) => {
    const phraseRef = ref(database, `quickPhrases/${id}`);
    update(phraseRef, { content })
      .catch((error) => {
        console.error("Error updating quick phrase:", error);
      });
  };

  const deleteQuickPhrase = (id: string) => {
    const phraseRef = ref(database, `quickPhrases/${id}`);
    remove(phraseRef)
      .catch((error) => {
        console.error("Error deleting quick phrase:", error);
      });
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
