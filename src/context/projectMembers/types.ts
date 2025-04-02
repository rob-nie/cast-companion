
import { ProjectMember } from "@/types/user";

export type UserRole = "owner" | "editor" | "viewer";

export type ProjectMembersContextType = {
  getProjectMembers: (projectId: string) => ProjectMember[];
  addProjectMember: (projectId: string, email: string, role: UserRole) => Promise<void>;
  removeProjectMember: (projectId: string, userId: string) => Promise<void>;
  updateProjectMemberRole: (projectId: string, userId: string, role: UserRole) => Promise<void>;
};
