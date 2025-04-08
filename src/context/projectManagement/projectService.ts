
import { supabase } from "@/integrations/supabase/client";
import { Project } from "./types";
import { toast } from "sonner";
import { ProjectMember, UserRole } from "@/types/user";

/**
 * Converts a Supabase project to our local Project model
 */
const mapDbProjectToProject = (dbProject: any): Project => {
  return {
    id: dbProject.id,
    title: dbProject.title,
    description: dbProject.description,
    ownerId: dbProject.owner_id,
    createdAt: new Date(dbProject.created_at),
    lastAccessed: dbProject.last_accessed ? new Date(dbProject.last_accessed) : undefined,
  };
};

/**
 * Fetch all projects the current user has access to
 */
export const fetchUserProjects = async (): Promise<Project[]> => {
  try {
    // Get all projects where the user is the owner or a member
    const { data: projectsData, error } = await supabase
      .from('projects')
      .select('*')
      .order('last_accessed', { ascending: false, nullsFirst: false });
    
    if (error) throw error;
    
    if (!projectsData || projectsData.length === 0) {
      return [];
    }
    
    // Convert to our model
    return projectsData.map(mapDbProjectToProject);
  } catch (error) {
    console.error("Error fetching projects:", error);
    throw error;
  }
};

/**
 * Create a new project
 */
export const createProject = async (projectData: Omit<Project, "id" | "createdAt" | "ownerId">): Promise<Project> => {
  try {
    // Get current user ID
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      toast.error("You must be logged in to create a project");
      throw new Error("User not logged in");
    }
    
    const userId = session.user.id;
    
    // Create project
    const { data, error } = await supabase
      .from('projects')
      .insert({
        title: projectData.title,
        description: projectData.description,
        owner_id: userId
      })
      .select()
      .single();
    
    if (error) {
      toast.error("Failed to create project");
      throw error;
    }
    
    toast.success("Project created successfully");
    
    return mapDbProjectToProject(data);
  } catch (error) {
    console.error("Error creating project:", error);
    throw error;
  }
};

/**
 * Update a project
 */
export const updateProject = async (id: string, updateData: Partial<Project>, silent = false): Promise<Project> => {
  try {
    // Map to DB field names
    const dbUpdateData: Record<string, any> = {};
    
    if (updateData.title !== undefined) dbUpdateData.title = updateData.title;
    if (updateData.description !== undefined) dbUpdateData.description = updateData.description;
    if (updateData.lastAccessed !== undefined) dbUpdateData.last_accessed = updateData.lastAccessed;
    
    // Update project
    const { data, error } = await supabase
      .from('projects')
      .update(dbUpdateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      if (!silent) toast.error("Failed to update project");
      throw error;
    }
    
    if (!silent) toast.success("Project updated");
    
    return mapDbProjectToProject(data);
  } catch (error) {
    console.error("Error updating project:", error);
    throw error;
  }
};

/**
 * Delete a project
 */
export const deleteProject = async (id: string): Promise<boolean> => {
  try {
    // Delete project (cascade will handle deleting members)
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);
    
    if (error) {
      toast.error("Failed to delete project");
      throw error;
    }
    
    toast.success("Project deleted");
    return true;
  } catch (error) {
    console.error("Error deleting project:", error);
    return false;
  }
};

/**
 * Fetch a single project by ID
 */
export const fetchProjectById = async (id: string): Promise<Project | null> => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code !== 'PGRST116') { // Not found
        toast.error("Error fetching project");
      }
      return null;
    }
    
    if (!data) return null;
    
    return mapDbProjectToProject(data);
  } catch (error) {
    console.error("Error fetching project:", error);
    throw error;
  }
};

/**
 * Add a member to a project
 */
export const addProjectMember = async (projectId: string, userId: string, role: UserRole): Promise<ProjectMember | null> => {
  try {
    // Check if user exists
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('id, name, email, avatar')
      .eq('id', userId)
      .single();
    
    if (userError || !userData) {
      toast.error("User not found");
      return null;
    }
    
    // Add member
    const { error } = await supabase
      .from('project_members')
      .insert({
        project_id: projectId,
        user_id: userId,
        role
      });
    
    if (error) {
      toast.error("Failed to add member");
      throw error;
    }
    
    toast.success(`${userData.name} added to project`);
    
    return {
      userId,
      projectId,
      role,
      name: userData.name || 'Unknown User',
      email: userData.email || '',
      avatar: userData.avatar || undefined
    };
  } catch (error) {
    console.error("Error adding project member:", error);
    throw error;
  }
};

/**
 * Fetch project members
 */
export const fetchProjectMembers = async (projectId: string): Promise<ProjectMember[]> => {
  try {
    // Join project_members with profiles
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
    
    if (!data || data.length === 0) return [];
    
    // Transform to ProjectMember type
    return data.map(member => ({
      userId: member.user_id,
      projectId: member.project_id,
      role: member.role as UserRole,
      name: member.profiles?.name || 'Unknown User',
      email: member.profiles?.email || '',
      avatar: member.profiles?.avatar || undefined
    }));
  } catch (error) {
    console.error("Error fetching project members:", error);
    throw error;
  }
};

/**
 * Remove a member from a project
 */
export const removeProjectMember = async (projectId: string, userId: string): Promise<boolean> => {
  try {
    // Check if user is the owner
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('owner_id')
      .eq('id', projectId)
      .single();
    
    if (projectError) throw projectError;
    
    if (projectData.owner_id === userId) {
      toast.error("Cannot remove the project owner");
      throw new Error("Cannot remove the project owner");
    }
    
    // Remove member
    const { error } = await supabase
      .from('project_members')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', userId);
    
    if (error) {
      toast.error("Failed to remove member");
      throw error;
    }
    
    toast.success("Member removed");
    return true;
  } catch (error) {
    console.error("Error removing project member:", error);
    return false;
  }
};

/**
 * Update a member's role
 */
export const updateMemberRole = async (projectId: string, userId: string, role: UserRole): Promise<boolean> => {
  try {
    // Check if user is the owner
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('owner_id')
      .eq('id', projectId)
      .single();
    
    if (projectError) throw projectError;
    
    // Cannot change owner's role
    if (projectData.owner_id === userId && role !== 'owner') {
      toast.error("Cannot change the owner's role");
      throw new Error("Cannot change the owner's role");
    }
    
    // Update role
    const { error } = await supabase
      .from('project_members')
      .update({ role })
      .eq('project_id', projectId)
      .eq('user_id', userId);
    
    if (error) {
      toast.error("Failed to update role");
      throw error;
    }
    
    toast.success("Role updated");
    return true;
  } catch (error) {
    console.error("Error updating member role:", error);
    return false;
  }
};
