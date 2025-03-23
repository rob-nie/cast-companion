
export type Message = {
  id: string;
  projectId: string;
  sender: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
  isImportant: boolean;
};

export type QuickPhrase = {
  id: string;
  userId: string;
  content: string;
};
