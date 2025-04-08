
import { supabase } from "@/integrations/supabase/client";
import { ProjectMember, UserRole } from "@/types/user";

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
        profiles:user_id(
          name,
          email,
          avatar
        )
      `)
      .eq('project_id', projectId);

    if (error) throw error;

    if (!data) return [];
    
    // Transform data to expected format
    return data.map(item => {
      // Safely extract profile data
      const profile = item.profiles as { name?: string; email?: string; avatar?: string } | null;
      
      return {
        userId: item.user_id,
        projectId: item.project_id,
        role: item.role as UserRole,
        name: profile?.name || 'Unknown User',
        email: profile?.email || '',
        avatar: profile?.avatar
      };
    });
  } catch (error) {
    console.error("Error fetching project members:", error);
    throw error;
  }
};
