
import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useProjects } from "./ProjectContext";
import { useUser } from "./UserContext";
import { Message, QuickPhrase } from "@/types/messenger";

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

// Sample user IDs
const CURRENT_USER = "user-1"; // This would typically come from an auth context
const OTHER_USER = "user-2";

// Sample data
const initialMessages: Message[] = [
  {
    id: "msg-1",
    projectId: "1",
    sender: OTHER_USER,
    content: "Könnten wir die technischen Fragen vertiefen?",
    timestamp: new Date("2024-06-10T10:15:00"),
    isRead: false,
    isImportant: true,
  },
  {
    id: "msg-2",
    projectId: "1",
    sender: CURRENT_USER,
    content: "In Ordnung, ich stelle weitere Fragen zur Technologie.",
    timestamp: new Date("2024-06-10T10:16:30"),
    isRead: true,
    isImportant: false,
  },
  {
    id: "msg-3",
    projectId: "2",
    sender: OTHER_USER,
    content: "Wir sollten das Budget genauer besprechen.",
    timestamp: new Date("2024-06-05T14:30:00"),
    isRead: true,
    isImportant: false,
  }
];

const initialQuickPhrases: QuickPhrase[] = [
  {
    id: "qp-1",
    userId: CURRENT_USER,
    content: "Bitte nächste Frage",
  },
  {
    id: "qp-2",
    userId: CURRENT_USER,
    content: "Mehr Details benötigt",
  },
  {
    id: "qp-3",
    userId: CURRENT_USER,
    content: "Thema abschließen",
  },
  {
    id: "qp-4",
    userId: OTHER_USER,
    content: "Das verstehe ich nicht",
  },
  {
    id: "qp-5",
    userId: OTHER_USER,
    content: "Können wir das vertiefen?",
  }
];

export const MessagesProvider = ({ children }: { children: ReactNode }) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [quickPhrases, setQuickPhrases] = useState<QuickPhrase[]>(initialQuickPhrases);
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
  const { currentProject } = useProjects();
  const { user } = useUser();

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
    const newMessage = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date(),
      isRead: message.sender === (user?.id || CURRENT_USER), // Messages from current user are automatically read
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const markAsRead = (id: string) => {
    console.log('MessagesContext: Marking message as read:', id);
    setMessages((prev) => {
      const updated = prev.map((message) =>
        message.id === id ? { ...message, isRead: true } : message
      );
      console.log('Updated messages after markAsRead:', 
        updated.filter(m => m.id === id).map(m => ({ id: m.id, isRead: m.isRead }))
      );
      return updated;
    });
  };

  const toggleImportant = (id: string) => {
    console.log('MessagesContext: Toggling message importance:', id);
    setMessages((prev) => {
      const updated = prev.map((message) =>
        message.id === id ? { ...message, isImportant: !message.isImportant } : message
      );
      console.log('Updated messages after toggleImportant:', 
        updated.filter(m => m.id === id).map(m => ({ id: m.id, isImportant: m.isImportant }))
      );
      return updated;
    });
  };

  const addQuickPhrase = (content: string, userId: string) => {
    const newQuickPhrase = {
      id: Date.now().toString(),
      userId,
      content,
    };
    setQuickPhrases((prev) => [...prev, newQuickPhrase]);
  };

  const updateQuickPhrase = (id: string, content: string) => {
    setQuickPhrases((prev) =>
      prev.map((phrase) =>
        phrase.id === id ? { ...phrase, content } : phrase
      )
    );
  };

  const deleteQuickPhrase = (id: string) => {
    setQuickPhrases((prev) => prev.filter((phrase) => phrase.id !== id));
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
