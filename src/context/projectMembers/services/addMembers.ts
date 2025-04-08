
import { supabase } from "@/integrations/supabase/client";
import { ProjectMember, UserRole } from "@/types/user";
import { toast } from "sonner";

/**
 * Find a user by email
 * @param email The email to search for
 */
export const findUserByEmail = async (email: string) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, email')
      .eq('email', email)
      .single();
      
    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No results found
      }
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error("Error finding user:", error);
    throw error;
  }
};

/**
 * Add a member to a project
 * @param projectId The project to add the member to
 * @param email The email of the user to add
 * @param role The role to assign to the user
 */
export const addMemberByEmail = async (projectId: string, email: string, role: UserRole): Promise<ProjectMember | null> => {
  try {
    // Find the user by email
    const userData = await findUserByEmail(email);
    
    if (!userData) {
      toast.error("User not found");
      throw new Error("User not found");
    }
    
    // Check if user is already a member
    const { data: existingMember, error: checkError } = await supabase
      .from('project_members')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', userData.id)
      .single();
    
    if (existingMember) {
      toast.error("User is already a member of this project");
      throw new Error("User is already a member of this project");
    }
    
    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
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
      toast.error(error.message || "Error adding member");
      throw error;
    }
    
    toast.success(`${userData.name} added to the project`);
    return {
      userId: userData.id,
      projectId,
      role,
      name: userData.name,
      email: userData.email,
      avatar: undefined
    };
  } catch (error) {
    console.error("Error adding member:", error);
    throw error;
  }
};

/**
 * Add a member to a project by user ID
 * @param projectId The project to add the member to
 * @param userId The ID of the user to add
 * @param role The role to assign to the user
 */
export const addMemberByUserId = async (projectId: string, userId: string, role: UserRole): Promise<ProjectMember | null> => {
  try {
    // Get user data
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('id, name, email, avatar')
      .eq('id', userId)
      .single();
    
    if (userError || !userData) {
      toast.error("User not found");
      throw new Error("User not found");
    }
    
    // Check if user is already a member
    const { data: existingMember, error: checkError } = await supabase
      .from('project_members')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .single();
    
    if (existingMember) {
      toast.error("User is already a member of this project");
      throw new Error("User is already a member of this project");
    }
    
    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
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
      toast.error(error.message || "Error adding member");
      throw error;
    }
    
    toast.success(`${userData.name} added to the project`);
    return {
      userId,
      projectId,
      role,
      name: userData.name,
      email: userData.email,
      avatar: userData.avatar
    };
  } catch (error) {
    console.error("Error adding member:", error);
    throw error;
  }
};

// Export renamed functions for backwards compatibility
export const addMemberToProject = addMemberByEmail;
export const addMemberToProjectByUserId = addMemberByUserId;
