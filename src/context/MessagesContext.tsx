import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useProjects } from "./ProjectContext";
import { useUser } from "./UserContext";
import { Message, QuickPhrase } from "@/types/messenger";
import { ref, push, update, remove, onValue, query, orderByChild, limitToLast, equalTo } from "firebase/database";
import { database, QUERY_LIMIT } from "@/lib/firebase";

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
    
    // Only fetch messages for the current project, with limit
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
        
        setMessages(messagesList);
      } else {
        setMessages([]);
      }
    });
    
    return () => unsubscribe();
  }, [currentProject?.id, user?.id]);
  
  // Optimized query for QuickPhrases - only fetch for current user
  useEffect(() => {
    if (!user?.id) return;
    
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
    const newMessageRef = push(ref(database, 'messages'));
    const currentUserId = user?.id || "user-1";
    
    const newMessage = {
      ...message,
      id: newMessageRef.key!,
      timestamp: new Date().toISOString(),
      isRead: message.sender === currentUserId, // Messages from current user are automatically read
    };
    
    push(ref(database, 'messages'), newMessage)
      .catch((error) => {
        console.error("Error adding message:", error);
      });
  };

  const markAsRead = (id: string) => {
    console.log('MessagesContext: Marking message as read:', id);
    const messageRef = ref(database, `messages/${id}`);
    update(messageRef, { isRead: true })
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
    
    push(ref(database, 'quickPhrases'), newQuickPhrase)
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
