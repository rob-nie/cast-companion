
export type User = {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: Date;
};

export type UserRole = "owner" | "editor" | "viewer";

export type ProjectMember = {
  userId: string;
  projectId: string;
  role: UserRole;
  name: string;
  email: string;
  avatar?: string;
};
