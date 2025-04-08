
import { supabase } from "@/integrations/supabase/client";
import { ProjectMember } from "@/types/user";

/**
 * Fetches all members of a specific project
 * @param projectId The ID of the project to fetch members for
 */
export const fetchProjectMembers = async (projectId: string): Promise<ProjectMember[]> => {
  try {
    // Join project_members with profiles to get member details
    const { data, error } = await supabase
      .from('project_members')
      .select(`
        user_id,
        role,
        project_id,
        profiles:user_id (
          name,
          email,
          avatar
        )
      `)
      .eq('project_id', projectId);

    if (error) throw error;

    if (!data) return [];
    
    // Transform data to expected format
    return data.map(item => ({
      userId: item.user_id,
      projectId: item.project_id,
      role: item.role,
      name: item.profiles?.name || 'Unknown User',
      email: item.profiles?.email || '',
      avatar: item.profiles?.avatar
    }));
  } catch (error) {
    console.error("Error fetching project members:", error);
    throw error;
  }
};
