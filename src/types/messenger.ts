
export interface Message {
  id: string;
  projectId: string;
  userId: string;
  content: string;
  timestamp: string;
  isImportant: boolean;
  isSystem?: boolean;
  read: boolean;
  sender?: string; // Added to fix ImportantMessageDialog and MessageList errors
}

export interface QuickPhrase {
  id: string;
  content: string;
  userId?: string; // Adding userId to associate quick phrases with users
}
