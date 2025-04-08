
import { supabase } from "@/integrations/supabase/client";
import { Project } from "./types";
import { toast } from "sonner";

export const fetchUserProjects = async (): Promise<Project[]> => {
  try {
    // Get the current user session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error("No authenticated user found");
    }

    console.log("Fetching projects for user:", session.user.id);

    // First fetch projects owned by the user - without nesting project_members
    const { data: ownedProjects, error: ownedError } = await supabase
      .from('projects')
      .select('*')
      .eq('owner_id', session.user.id);

    if (ownedError) {
      console.error("Error fetching owned projects:", ownedError);
      throw ownedError;
    }

    // Then fetch project IDs where user is a member but not owner
    const { data: memberProjects, error: memberError } = await supabase
      .from('project_members')
      .select(`
        role,
        project_id
      `)
      .eq('user_id', session.user.id);

    if (memberError) {
      console.error("Error fetching member project IDs:", memberError);
      throw memberError;
    }

    // If there are member projects, fetch their full details
    let memberProjectsDetails: any[] = [];
    if (memberProjects && memberProjects.length > 0) {
      // Extract project IDs where user is a member
      const memberProjectIds = memberProjects.map(item => item.project_id);
      
      // Get the full details of these projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .in('id', memberProjectIds);
        
      if (projectsError) {
        console.error("Error fetching member project details:", projectsError);
        throw projectsError;
      }
      
      // Combine project details with roles
      memberProjectsDetails = (projectsData || []).map(project => {
        // Find the matching member entry to get the role
        const memberEntry = memberProjects.find(m => m.project_id === project.id);
        return {
          ...project,
          memberRole: memberEntry?.role
        };
      });
    }

    // Process owned projects into expected format
    const ownedProjectsList = (ownedProjects || []).map(project => {
      return {
        id: project.id,
        title: project.title,
        description: project.description || '',
        ownerId: project.owner_id,
        createdAt: new Date(project.created_at),
        lastAccessed: project.last_accessed ? new Date(project.last_accessed) : undefined,
        role: 'owner' // Set explicitly for owned projects
      };
    });

    // Process projects where user is a member
    const memberProjectsList = memberProjectsDetails.map(project => {
      return {
        id: project.id,
        title: project.title,
        description: project.description || '',
        ownerId: project.owner_id,
        createdAt: new Date(project.created_at),
        lastAccessed: project.last_accessed ? new Date(project.last_accessed) : undefined,
        role: project.memberRole // Use the role we stored earlier
      };
    });

    // Combine lists, avoiding duplicates (owned projects take precedence)
    const projectsMap = new Map();
    
    // Add owned projects first
    ownedProjectsList.forEach(project => {
      projectsMap.set(project.id, project);
    });
    
    // Add member projects if not already in the map
    memberProjectsList.forEach(project => {
      if (!projectsMap.has(project.id)) {
        projectsMap.set(project.id, project);
      }
    });
    
    const allProjects = Array.from(projectsMap.values());
    console.log("Fetched total projects:", allProjects.length);
    return allProjects;
  } catch (error) {
    console.error("Error fetching projects:", error);
    toast.error("Fehler beim Laden der Projekte. Bitte versuchen Sie es später erneut.");
    throw error;
  }
};

// Rest of the file stays the same
export const createProject = async (project: Omit<Project, "id" | "createdAt" | "ownerId">): Promise<Project> => {
  try {
    // Get the current user session
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    
    if (!user) {
      throw new Error("No authenticated user found");
    }

    const { data, error } = await supabase
      .from('projects')
      .insert([
        {
          title: project.title,
          description: project.description,
          owner_id: user.id,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      title: data.title,
      description: data.description || '',
      ownerId: data.owner_id,
      createdAt: new Date(data.created_at),
      lastAccessed: data.last_accessed ? new Date(data.last_accessed) : undefined,
    };
  } catch (error) {
    console.error("Error creating project:", error);
    throw error;
  }
};

export const updateProject = async (id: string, projectUpdate: Partial<Project>, silent: boolean = false): Promise<Project> => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .update({
        title: projectUpdate.title,
        description: projectUpdate.description,
        last_accessed: projectUpdate.lastAccessed ? projectUpdate.lastAccessed.toISOString() : null,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (!silent) {
        console.error("Error updating project:", error);
      }
      throw error;
    }

    return {
      id: data.id,
      title: data.title,
      description: data.description || '',
      ownerId: data.owner_id,
      createdAt: new Date(data.created_at),
      lastAccessed: data.last_accessed ? new Date(data.last_accessed) : undefined,
    };
  } catch (error) {
    console.error("Error updating project:", error);
    throw error;
  }
};

export const deleteProject = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error("Error deleting project:", error);
    return false;
  }
};
