
import { UserRole } from "@/types/user";

export type ProjectSharingContextType = {
  shareProject: (projectId: string, email: string, role: "editor" | "viewer") => Promise<any>;
  shareProjectByUserId: (projectId: string, userId: string, role: "editor" | "viewer") => Promise<any>;
  revokeAccess: (projectId: string, userId: string) => Promise<boolean | void>;
  changeRole: (projectId: string, userId: string, newRole: UserRole) => Promise<boolean | void>;
};
