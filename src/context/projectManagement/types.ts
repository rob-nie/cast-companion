
import { UserRole } from "@/types/user";

export interface Project {
  id: string;
  title: string;
  description?: string;
  ownerId: string;
  createdAt: Date;
  lastAccessed?: Date;
  role?: UserRole; // Adding role as an optional property
}

export interface ProjectManagementContextType {
  projects: Project[];
  currentProject: Project | null;
  setCurrentProject: (project: Project | null) => void;
  addProject: (project: Omit<Project, "id" | "createdAt" | "ownerId" | "role">) => Promise<Project | undefined>;
  updateProject: (id: string, projectUpdate: Partial<Project>, silent?: boolean) => Promise<Project | undefined>;
  deleteProject: (id: string) => Promise<boolean>;
  isLoading: boolean;
  loadError: string | null;
  refresh: () => Promise<Project[]>;
}
