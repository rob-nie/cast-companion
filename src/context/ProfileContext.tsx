
import { createContext, useContext, ReactNode } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
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
      if (!user) throw new Error("No user logged in");
      
      // Update the user profile in Supabase
      const { error } = await supabase
        .from('profiles')
        .update({
          name: data.name,
          avatar: data.avatar
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      toast.success("Profile updated");
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
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
