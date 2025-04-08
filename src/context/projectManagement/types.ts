
import { UserRole } from "@/types/user";

export interface Project {
  id: string;
  title: string;
  description?: string;
  ownerId: string;
  createdAt: Date;
  lastAccessed?: Date;
}

export interface ProjectManagementContextType {
  projects: Project[];
  currentProject: Project | null;
  setCurrentProject: (project: Project | null) => void;
  addProject: (project: Omit<Project, "id" | "createdAt" | "ownerId">) => Promise<void>;
  updateProject: (id: string, projectUpdate: Partial<Project>, silent?: boolean) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  isLoading: boolean;
  loadError: string | null;
}
