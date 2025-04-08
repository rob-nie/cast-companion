
import { ReactNode } from "react";
import { AuthProvider, useAuth } from "./AuthContext";
import { ProfileProvider, useProfile } from "./ProfileContext";
import { User, ProjectMember } from "@/types/user";

// Re-export types
export type { User, ProjectMember };

// Combined provider
export const UserProvider = ({ children }: { children: ReactNode }) => {
  return (
    <AuthProvider>
      <ProfileProvider>
        {children}
      </ProfileProvider>
    </AuthProvider>
  );
};

// Combined hook
export const useUser = () => {
  const auth = useAuth();
  const profile = useProfile();
  
  return {
    ...auth,
    ...profile
  };
};
