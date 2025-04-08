
import { ProjectMember, UserRole } from "@/types/user";

export type SetMembersFunction = (projectId: string, members: ProjectMember[]) => void;
