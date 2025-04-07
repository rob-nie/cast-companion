
export interface Note {
  id: string;
  projectId: string;
  userId: string;
  content: string;
  timestamp?: Date;
  stopwatchTime?: number;
  isLiveNote: boolean;
}
