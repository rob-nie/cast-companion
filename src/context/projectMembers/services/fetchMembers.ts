
import { supabase } from "@/integrations/supabase/client";
import { ProjectMember } from "@/types/user";
import { SetMembersFunction } from "../serviceTypes";

export const fetchProjectMembers = async (
  projectId: string,
  setMembers: SetMembersFunction
): Promise<() => void> => {
  if (!projectId) {
    console.error("Project ID is required");
    return () => {};
  }

  // Function to load members
  const loadMembers = async () => {
    try {
      // Get project members including profiles data
      const { data, error } = await supabase
        .from('project_members')
        .select(`
          user_id,
          role,
          profiles:user_id (
            name,
            email,
            avatar
          )
        `)
        .eq('project_id', projectId);

      if (error) throw error;

      // Transform to our ProjectMember format
      const projectMembers: ProjectMember[] = (data || []).map((item: any) => ({
        userId: item.user_id,
        projectId: projectId,
        role: item.role,
        name: item.profiles?.name || 'Unknown User',
        email: item.profiles?.email || '',
        avatar: item.profiles?.avatar
      }));

      setMembers(projectId, projectMembers);
    } catch (error) {
      console.error("Error fetching project members:", error);
      setMembers(projectId, []);
    }
  };

  // Initial load
  await loadMembers();

  // Setup real-time subscription
  const subscription = supabase
    .channel('project-members-changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'project_members',
      filter: `project_id=eq.${projectId}`,
    }, () => {
      loadMembers();
    })
    .subscribe();

  // Return cleanup function
  return () => {
    supabase.removeChannel(subscription);
  };
};
