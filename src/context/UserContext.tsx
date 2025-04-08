
import { ReactNode } from "react";
import { AuthProvider, useAuth } from "./AuthContext";
import { ProfileProvider, useProfile } from "./ProfileContext";
import { User, ProjectMember } from "@/types/user";

// Re-export types
export type { User, ProjectMember };

// Kombinierter Provider für Benutzer-bezogene Funktionalität
export const UserProvider = ({ children }: { children: ReactNode }) => {
  return (
    <AuthProvider>
      <ProfileProvider>
        {children}
      </ProfileProvider>
    </AuthProvider>
  );
};

// Kombinierter Hook für Benutzer-bezogene Funktionalität
export const useUser = () => {
  const auth = useAuth();
  const profile = useProfile();
  
  return {
    ...auth,
    ...profile
  };
};
