
import { ProjectMember } from "@/types/user";

export type SetMembersFunction = (projectId: string, members: ProjectMember[]) => void;

export type MembershipStatus = {
  isLoading: boolean;
  error: string | null;
  members: ProjectMember[];
};

export type ProjectMembershipCacheType = Map<string, MembershipStatus>;

export interface MembershipOperationResult {
  success: boolean;
  error?: string;
}
