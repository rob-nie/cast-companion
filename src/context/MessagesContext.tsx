
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Message } from "@/types/messenger";
import { useProjects } from "./ProjectContext";
import { useUser } from "./UserContext";
import { v4 as uuidv4 } from "uuid";

// Define the context types
interface MessagesContextType {
  messages: Message[];
  addMessage: (content: string, userId?: string) => void;
  markImportant: (id: string, important: boolean) => void;
  clearMessages: () => void;
  unreadMessages: number;
  markAllAsRead: () => void;
}

const MessagesContext = createContext<MessagesContextType | undefined>(undefined);

export const MessagesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentProject } = useProjects();
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadMessages, setUnreadMessages] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<string>("");

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
    } else {
      setMessages([]);
    }
  }, [currentProject]);

  // Save messages to localStorage when they change
  useEffect(() => {
    if (currentProject && messages.length > 0) {
      localStorage.setItem(`messages-${currentProject.id}`, JSON.stringify(messages));
    }
  }, [messages, currentProject]);

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
      content,
      timestamp: new Date().toISOString(),
      isImportant: false,
      isSystem: !userId && !user?.id,
      read: userId === user?.id, // Mark as read if sent by current user
    };

    setMessages((prev) => [...prev, newMessage]);
  };

  const markImportant = (id: string, important: boolean) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === id ? { ...msg, isImportant: important } : msg
      )
    );
  };

  const clearMessages = () => {
    if (currentProject) {
      const systemMessage: Message = {
        id: uuidv4(),
        projectId: currentProject.id,
        userId: "system",
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

  return (
    <MessagesContext.Provider
      value={{
        messages,
        addMessage,
        markImportant,
        clearMessages,
        unreadMessages,
        markAllAsRead,
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
