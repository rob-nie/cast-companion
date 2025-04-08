
import { supabase } from "@/integrations/supabase/client";
import { UserRole } from "@/types/user";
import { toast } from "sonner";

export const addMemberToProject = async (projectId: string, email: string, role: UserRole) => {
  try {
    // First find the user by email
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();
      
    if (userError) {
      if (userError.code === 'PGRST116') {
        toast.error("User not found");
      } else {
        toast.error(userError.message || "Error finding user");
      }
      throw userError;
    }
    
    // Add the user to the project
    const { error } = await supabase
      .from('project_members')
      .insert({
        project_id: projectId,
        user_id: userData.id,
        role
      });
      
    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        toast.error("User is already a member of this project");
      } else {
        toast.error(error.message || "Error adding member");
      }
      throw error;
    }
    
    toast.success("Member added successfully");
    return true;
  } catch (error) {
    console.error("Error adding member:", error);
    throw error;
  }
};

export const addMemberToProjectByUserId = async (projectId: string, userId: string, role: UserRole) => {
  try {
    // Check if user exists
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', userId)
      .single();
      
    if (userError) {
      toast.error("User not found");
      throw userError;
    }
    
    // Add the user to the project
    const { error } = await supabase
      .from('project_members')
      .insert({
        project_id: projectId,
        user_id: userId,
        role
      });
      
    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        toast.error("User is already a member of this project");
      } else {
        toast.error(error.message || "Error adding member");
      }
      throw error;
    }
    
    toast.success(`${userData.name || "User"} added to project`);
    return true;
  } catch (error) {
    console.error("Error adding member by ID:", error);
    throw error;
  }
};
