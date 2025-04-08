
import { supabase } from "@/integrations/supabase/client";
import { UserRole } from "@/types/user";
import { toast } from "sonner";

export const updateMemberRole = async (projectId: string, userId: string, role: UserRole) => {
  try {
    // Check if user is project owner
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('owner_id')
      .eq('id', projectId)
      .single();
      
    if (projectError) {
      toast.error("Project not found");
      throw projectError;
    }
    
    // Cannot change owner's role
    if (projectData.owner_id === userId && role !== 'owner') {
      toast.error("Cannot change the owner's role");
      throw new Error("Cannot change the owner's role");
    }
    
    // Update the member role
    const { error } = await supabase
      .from('project_members')
      .update({ role })
      .eq('project_id', projectId)
      .eq('user_id', userId);
      
    if (error) {
      toast.error(error.message || "Error updating role");
      throw error;
    }
    
    toast.success("Role updated");
    return true;
  } catch (error) {
    console.error("Error updating role:", error);
    throw error;
  }
};
