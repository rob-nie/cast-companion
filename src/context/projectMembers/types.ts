
import { ProjectMember, UserRole } from "@/types/user";

export type ProjectMembersContextType = {
  getProjectMembers: (projectId: string) => Promise<ProjectMember[]>;
  addProjectMember: (projectId: string, email: string, role: UserRole) => Promise<void>;
  addProjectMemberByUserId: (projectId: string, userId: string, role: UserRole) => Promise<void>;
  removeProjectMember: (projectId: string, userId: string) => Promise<void>;
  updateProjectMemberRole: (projectId: string, userId: string, role: UserRole) => Promise<void>;
};
