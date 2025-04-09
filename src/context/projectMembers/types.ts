
import { ProjectMember, UserRole } from "@/types/user";

export type ProjectMembersContextType = {
  getProjectMembers: (projectId: string) => Promise<ProjectMember[]>;
  addProjectMember: (projectId: string, email: string, role: UserRole) => Promise<ProjectMember | undefined>;
  addProjectMemberByUserId: (projectId: string, userId: string, role: UserRole) => Promise<ProjectMember | undefined>;
  removeProjectMember: (projectId: string, userId: string) => Promise<boolean>;
  updateProjectMemberRole: (projectId: string, userId: string, role: UserRole) => Promise<boolean>;
  clearProjectCache?: (projectId: string) => void;
};
