
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Project } from "./types";
import { UserRole } from "@/types/user";

// Helper to convert database date strings to Date objects
const convertDates = (project: any): Project => ({
  ...project,
  id: project.id,
  title: project.title,
  description: project.description,
  ownerId: project.owner_id,
  createdAt: project.created_at ? new Date(project.created_at) : new Date(),
  lastAccessed: project.last_accessed ? new Date(project.last_accessed) : undefined
});

// Projects retrieval with subscription capability
export const fetchProjects = (userId: string, callback: (projects: Project[]) => void) => {
  if (!userId) {
    callback([]);
    return () => {};
  }

  // Fetch projects where user is owner or member
  const fetchAllProjects = async () => {
    try {
      console.log(`Fetching projects for user: ${userId}`);
      
      // Get projects where user is owner
      const { data: ownedProjects, error: ownedError } = await supabase
        .from('projects')
        .select('*')
        .eq('owner_id', userId);
      
      if (ownedError) throw ownedError;
      
      // Get projects where user is a member
      const { data: memberships, error: memberError } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('user_id', userId);
        
      if (memberError) throw memberError;
      
      // If user is a member of any projects, fetch those projects
      let memberProjects: any[] = [];
      
      if (memberships && memberships.length > 0) {
        const projectIds = memberships.map(m => m.project_id);
        
        const { data: projects, error: projectsError } = await supabase
          .from('projects')
          .select('*')
          .in('id', projectIds);
          
        if (projectsError) throw projectsError;
        
        memberProjects = projects || [];
      }
      
      // Combine and deduplicate projects
      const allProjects = [...(ownedProjects || []), ...memberProjects];
      const uniqueProjects = allProjects.filter((project, index, self) =>
        index === self.findIndex(p => p.id === project.id)
      );
      
      // Convert to our Project type and sort by last accessed
      const formattedProjects = uniqueProjects.map(convertDates);
      
      formattedProjects.sort((a, b) => {
        const dateA = a.lastAccessed || a.createdAt;
        const dateB = b.lastAccessed || b.createdAt;
        return dateB.getTime() - dateA.getTime();
      });
      
      callback(formattedProjects);
      console.log(`Loaded ${formattedProjects.length} projects`);
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast.error("Projects could not be loaded");
      callback([]);
    }
  };
  
  // Initial fetch
  fetchAllProjects();
  
  // Set up real-time subscription for projects
  const projectsSubscription = supabase
    .channel('projects-changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'projects',
    }, () => {
      fetchAllProjects();
    })
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'project_members',
      filter: `user_id=eq.${userId}`,
    }, () => {
      fetchAllProjects();
    })
    .subscribe();

  // Return cleanup function
  return () => {
    supabase.removeChannel(projectsSubscription);
  };
};

// Add project with appropriate error handling
export const addProjectToFirebase = async (
  project: Omit<Project, "id" | "createdAt" | "ownerId">, 
  userId: string
) => {
  if (!userId) {
    toast.error("You must be logged in to create a project");
    return null;
  }
  
  try {
    const { data, error } = await supabase
      .from('projects')
      .insert({
        title: project.title,
        description: project.description,
        owner_id: userId
      })
      .select()
      .single();
      
    if (error) throw error;
    
    toast.success("Project created");
    return convertDates(data);
  } catch (error: any) {
    console.error("Error creating project:", error);
    toast.error(error.message || "Error creating project");
    return null;
  }
};

// Update project
export const updateProjectInFirebase = async (id: string, projectUpdate: Partial<Project>, silent: boolean = false) => {
  try {
    // Convert our camelCase to snake_case for Supabase
    const updates: Record<string, any> = {};
    
    if (projectUpdate.title !== undefined) updates.title = projectUpdate.title;
    if (projectUpdate.description !== undefined) updates.description = projectUpdate.description;
    if (projectUpdate.lastAccessed !== undefined) updates.last_accessed = projectUpdate.lastAccessed;
    
    const { error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id);
      
    if (error) throw error;
    
    if (!silent) {
      toast.success("Project updated");
    }
    return true;
  } catch (error: any) {
    console.error("Error updating project:", error);
    if (!silent) {
      toast.error(error.message || "Error updating project");
    }
    return false;
  }
};

// Delete project
export const deleteProjectFromFirebase = async (id: string) => {
  try {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    
    toast.success("Project deleted");
    return true;
  } catch (error: any) {
    console.error("Error deleting project:", error);
    toast.error(error.message || "Error deleting project");
    return false;
  }
};

// Project members management
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
