import { Timestamp } from "firebase/firestore";

export interface Project {
  id: string;
  title: string;
  description?: string;
  createdAt: Date;
  lastAccessed?: Date;
  ownerId: string;
}

export interface ProjectContextType {
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  setCurrentProject: (project: Project | null) => void;
  addProject: (project: Omit<Project, "id" | "createdAt" | "ownerId">) => Promise<void>;
  updateProject: (id: string, projectUpdate: Partial<Project>, silent?: boolean) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  getUserProjects: () => Project[];
  getSharedProjects: () => Project[];
}
