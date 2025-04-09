
export type Message = {
  id: string;
  projectId: string;
  sender: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
  isImportant: boolean;
  recipient?: string;
};

export type QuickPhrase = {
  id: string;
  userId: string;
  content: string;
};
