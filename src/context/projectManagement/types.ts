
import { User } from "@/types/user";

export type Project = {
  id: string;
  title: string;
  description: string;
  createdAt: Date;
  lastAccessed?: Date;
  ownerId: string;
};

export type ProjectContextType = {
  projects: Project[];
  currentProject: Project | null;
  setCurrentProject: (project: Project) => void;
  addProject: (project: Omit<Project, "id" | "createdAt" | "ownerId">) => Promise<void>;
  updateProject: (id: string, project: Partial<Project>, silent?: boolean) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  getUserProjects: () => Project[];
  getSharedProjects: () => Project[];
};
