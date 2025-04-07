
export interface Message {
  id: string;
  projectId: string;
  userId: string;
  content: string;
  timestamp: string;
  isImportant: boolean;
  isSystem?: boolean;
  read: boolean;
}

export interface QuickPhrase {
  id: string;
  content: string;
}
