
import { createContext, useContext, ReactNode } from "react";
import { toast } from "sonner";
import { ref, update } from "firebase/database";
import { updateProfile as updateFirebaseProfile } from "firebase/auth";
import { database, auth } from "@/lib/firebase";
import { useAuth } from "./AuthContext";
import { User } from "@/types/user";

type ProfileContextType = {
  updateProfile: (data: Partial<User>) => Promise<void>;
};

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();

  const updateProfile = async (data: Partial<User>) => {
    try {
      if (!user) throw new Error("Kein Benutzer angemeldet");
      
      // Update the user data in the database
      const userRef = ref(database, `users/${user.id}`);
      await update(userRef, { ...data });
      
      // Update display name in Firebase Auth if it has changed
      if (data.name && auth.currentUser) {
        await updateFirebaseProfile(auth.currentUser, { displayName: data.name });
      }
      
      toast.success("Profil aktualisiert");
    } catch (error) {
      toast.error("Profilaktualisierung fehlgeschlagen");
      throw error;
    }
  };

  return (
    <ProfileContext.Provider
      value={{
        updateProfile
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
};
