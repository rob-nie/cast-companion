
import { ReactNode } from "react";
import { AuthProvider, useAuth } from "./AuthContext";
import { ProfileProvider, useProfile } from "./ProfileContext";
import { ProjectMembersProvider, useProjectMembers } from "./projectMembers";
import { User, ProjectMember } from "@/types/user";

// Re-export types
export type { User, ProjectMember };

// Combined provider
export const UserProvider = ({ children }: { children: ReactNode }) => {
  return (
    <AuthProvider>
      <ProfileProvider>
        <ProjectMembersProvider>
          {children}
        </ProjectMembersProvider>
      </ProfileProvider>
    </AuthProvider>
  );
};

// Combined hook that uses all three contexts
export const useUser = () => {
  const auth = useAuth();
  const profile = useProfile();
  const projectMembers = useProjectMembers();
  
  return {
    ...auth,
    ...profile,
    ...projectMembers
  };
};
