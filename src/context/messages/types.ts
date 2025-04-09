
import { Message, QuickPhrase } from "@/types/messenger";

export type MessagesContextType = {
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
