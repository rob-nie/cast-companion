
import { ProjectMember, UserRole } from "@/types/user";

// Define project structure
export interface Project {
  id: string;
  title: string;
  description?: string;
  createdAt: Date;
  lastAccessed?: Date;
  ownerId: string;
  members?: Record<string, { role: UserRole }>;
}

// Context type for ProjectManagement
export type ProjectManagementContextType = {
  projects: Project[];
  currentProject: Project | null;
  setCurrentProject: (project: Project | null) => void;
  addProject: (project: Omit<Project, "id" | "createdAt" | "ownerId">) => void;
  updateProject: (id: string, projectUpdate: Partial<Project>, silent?: boolean) => Promise<void>;
  deleteProject: (id: string) => void;
  getUserProjects: () => Project[];
  getSharedProjects: () => Project[];
  getProjectMembers: (projectId: string) => Promise<ProjectMember[]>;
  shareProject: (projectId: string, email: string, role: "editor" | "viewer") => Promise<void>;
  shareProjectByUserId: (projectId: string, userId: string, role: "editor" | "viewer") => Promise<void>;
  revokeAccess: (projectId: string, userId: string) => Promise<void>;
  changeRole: (projectId: string, userId: string, newRole: UserRole) => Promise<void>;
  isLoading: boolean;
};
