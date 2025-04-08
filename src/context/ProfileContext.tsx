
import { createContext, useContext, useState, ReactNode } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";
import { User } from "@/types/user";

type ProfileContextType = {
  updateProfile: (data: Partial<User>) => Promise<void>;
  isUpdating: boolean;
};

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);

  const updateProfile = async (data: Partial<User>) => {
    if (isUpdating) return;
    
    try {
      setIsUpdating(true);
      
      if (!user) {
        toast.error("Nicht angemeldet");
        throw new Error("Kein Benutzer angemeldet");
      }
      
      const updateData: Record<string, any> = {};
      
      if (data.name !== undefined) updateData.name = data.name;
      if (data.avatar !== undefined) updateData.avatar = data.avatar;
      
      // Profil in Supabase aktualisieren
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);
      
      if (error) {
        console.error("Fehler beim Aktualisieren des Profils:", error);
        toast.error("Profil konnte nicht aktualisiert werden");
        throw error;
      }
      
      toast.success("Profil aktualisiert");
    } catch (error: any) {
      console.error("Fehler beim Aktualisieren des Profils:", error);
      toast.error("Profil konnte nicht aktualisiert werden");
      throw error;
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <ProfileContext.Provider
      value={{
        updateProfile,
        isUpdating
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
