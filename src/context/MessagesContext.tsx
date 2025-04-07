
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Message, QuickPhrase } from "@/types/messenger";
import { useProjects } from "./ProjectContext";
import { useUser } from "./UserContext";
import { v4 as uuidv4 } from "uuid";

// Define the context types
interface MessagesContextType {
  messages: Message[];
  addMessage: (content: string, userId?: string) => void;
  markAsRead: (id: string) => void;
  markImportant: (id: string, important: boolean) => void;
  toggleImportant: (id: string) => void;
  clearMessages: () => void;
  unreadMessages: number;
  markAllAsRead: () => void;
  // QuickPhrases-related functions
  quickPhrases: QuickPhrase[];
  addQuickPhrase: (content: string, userId?: string) => void;
  updateQuickPhrase: (id: string, content: string) => void;
  deleteQuickPhrase: (id: string) => void;
  getQuickPhrasesForUser: (userId: string) => QuickPhrase[];
}

const MessagesContext = createContext<MessagesContextType | undefined>(undefined);

export const MessagesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentProject } = useProjects();
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadMessages, setUnreadMessages] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<string>("");
  const [quickPhrases, setQuickPhrases] = useState<QuickPhrase[]>([]);

  // Initialize with dummy data
  useEffect(() => {
    if (currentProject) {
      const savedMessages = localStorage.getItem(`messages-${currentProject.id}`);
      if (savedMessages) {
        setMessages(JSON.parse(savedMessages));
      } else {
        // Mock initial messages for demo
        const initialMessages: Message[] = [
          {
            id: uuidv4(),
            projectId: currentProject.id,
            userId: "system",
            sender: "system",
            content: "Willkommen beim Interview-Chat!",
            timestamp: new Date().toISOString(),
            isImportant: false,
            isSystem: true,
            read: true,
          },
        ];
        setMessages(initialMessages);
        localStorage.setItem(`messages-${currentProject.id}`, JSON.stringify(initialMessages));
      }

      // Load quick phrases
      const savedQuickPhrases = localStorage.getItem(`quickPhrases-${currentProject.id}`);
      if (savedQuickPhrases) {
        setQuickPhrases(JSON.parse(savedQuickPhrases));
      } else {
        setQuickPhrases([]);
      }
    } else {
      setMessages([]);
      setQuickPhrases([]);
    }
  }, [currentProject]);

  // Save messages to localStorage when they change
  useEffect(() => {
    if (currentProject && messages.length > 0) {
      localStorage.setItem(`messages-${currentProject.id}`, JSON.stringify(messages));
    }
  }, [messages, currentProject]);

  // Save quick phrases to localStorage when they change
  useEffect(() => {
    if (currentProject && quickPhrases.length > 0) {
      localStorage.setItem(`quickPhrases-${currentProject.id}`, JSON.stringify(quickPhrases));
    }
  }, [quickPhrases, currentProject]);

  // Count unread messages
  useEffect(() => {
    const count = messages.filter(msg => !msg.read && msg.userId !== user?.id).length;
    setUnreadMessages(count);
  }, [messages, user?.id]);

  // Track active tab for marking messages as read
  useEffect(() => {
    const handleTabFocus = () => {
      if (activeTab === "messages") {
        markAllAsRead();
      }
    };

    window.addEventListener("focus", handleTabFocus);
    return () => window.removeEventListener("focus", handleTabFocus);
  }, [activeTab]);

  const setActiveTabHandler = useCallback((tab: string) => {
    setActiveTab(tab);
    if (tab === "messages") {
      markAllAsRead();
    }
  }, []);

  const addMessage = (content: string, userId?: string) => {
    if (!currentProject) return;

    const newMessage: Message = {
      id: uuidv4(),
      projectId: currentProject.id,
      userId: userId || user?.id || "user-1",
      sender: userId || user?.id || "user-1", // Add sender property
      content,
      timestamp: new Date().toISOString(),
      isImportant: false,
      isSystem: !userId && !user?.id,
      read: userId === user?.id, // Mark as read if sent by current user
    };

    setMessages((prev) => [...prev, newMessage]);
  };

  const markAsRead = (id: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === id ? { ...msg, read: true } : msg
      )
    );
  };

  const markImportant = (id: string, important: boolean) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === id ? { ...msg, isImportant: important } : msg
      )
    );
  };

  const toggleImportant = (id: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === id ? { ...msg, isImportant: !msg.isImportant } : msg
      )
    );
  };

  const clearMessages = () => {
    if (currentProject) {
      const systemMessage: Message = {
        id: uuidv4(),
        projectId: currentProject.id,
        userId: "system",
        sender: "system",
        content: "Alle Nachrichten wurden gelöscht.",
        timestamp: new Date().toISOString(),
        isImportant: false,
        isSystem: true,
        read: true,
      };
      setMessages([systemMessage]);
      localStorage.setItem(
        `messages-${currentProject.id}`,
        JSON.stringify([systemMessage])
      );
    }
  };

  const markAllAsRead = () => {
    setMessages(prev => 
      prev.map(msg => ({...msg, read: true}))
    );
    setUnreadMessages(0);
  };

  // QuickPhrases methods
  const addQuickPhrase = (content: string, userId?: string) => {
    if (!content.trim()) return;
    
    const newPhrase: QuickPhrase = {
      id: uuidv4(),
      content,
      userId: userId || user?.id
    };
    
    setQuickPhrases(prev => [...prev, newPhrase]);
  };
  
  const updateQuickPhrase = (id: string, content: string) => {
    if (!content.trim()) return;
    
    setQuickPhrases(prev =>
      prev.map(phrase =>
        phrase.id === id ? { ...phrase, content } : phrase
      )
    );
  };
  
  const deleteQuickPhrase = (id: string) => {
    setQuickPhrases(prev => prev.filter(phrase => phrase.id !== id));
  };
  
  const getQuickPhrasesForUser = (userId: string) => {
    return quickPhrases.filter(phrase => !phrase.userId || phrase.userId === userId);
  };

  return (
    <MessagesContext.Provider
      value={{
        messages,
        addMessage,
        markAsRead,
        markImportant,
        toggleImportant,
        clearMessages,
        unreadMessages,
        markAllAsRead,
        quickPhrases,
        addQuickPhrase,
        updateQuickPhrase,
        deleteQuickPhrase,
        getQuickPhrasesForUser
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
