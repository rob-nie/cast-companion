
import { Dispatch, SetStateAction } from "react";

export type Project = {
  id: string;
  title: string;
  description: string;
  createdAt: Date;
  lastAccessed?: Date;
  ownerId: string;
};

export type ProjectManagementContextType = {
  projects: Project[];
  currentProject: Project | null;
  setCurrentProject: (project: Project) => void;
  addProject: (project: Omit<Project, "id" | "createdAt" | "ownerId">) => void;
  updateProject: (id: string, project: Partial<Project>, silent?: boolean) => void;
  deleteProject: (id: string) => void;
  getUserProjects: () => Project[];
  getSharedProjects: () => Project[];
  isLoading: boolean;
};

export type ProjectManagementProviderProps = {
  projects: Project[];
  setProjects: Dispatch<SetStateAction<Project[]>>;
  currentProject: Project | null;
  setCurrentProject: Dispatch<SetStateAction<Project | null>>;
};
