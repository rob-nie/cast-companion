
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const removeMemberFromProject = async (projectId: string, userId: string) => {
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
    
    if (projectData.owner_id === userId) {
      toast.error("Cannot remove the project owner");
      throw new Error("Cannot remove the project owner");
    }
    
    // Remove the user from the project
    const { error } = await supabase
      .from('project_members')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', userId);
      
    if (error) {
      toast.error(error.message || "Error removing member");
      throw error;
    }
    
    toast.success("Member removed");
    return true;
  } catch (error) {
    console.error("Error removing member:", error);
    throw error;
  }
};
