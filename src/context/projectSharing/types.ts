
export type ProjectSharingContextType = {
  shareProject: (projectId: string, email: string, role: "editor" | "viewer") => Promise<void>;
  shareProjectByUserId: (projectId: string, userId: string, role: "editor" | "viewer") => Promise<void>;
  revokeAccess: (projectId: string, userId: string) => Promise<void>;
  changeRole: (projectId: string, userId: string, newRole: "owner" | "editor" | "viewer") => Promise<void>;
};
