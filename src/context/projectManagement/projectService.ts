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

    // Fetch projects directly with one query instead of separate queries
    // This avoids potential recursive policy issues
    const { data: allProjects, error } = await supabase
      .from('projects')
      .select(`
        *,
        project_members!project_members_project_id_fkey (
          role
        )
      `)
      .or(`owner_id.eq.${session.user.id},project_members.user_id.eq.${session.user.id}`);

    if (error) {
      console.error("Error fetching projects:", error);
      throw error;
    }

    if (!allProjects) {
      return [];
    }

    // Process into the expected format
    const projectsList = allProjects.map(project => {
      return {
        id: project.id,
        title: project.title,
        description: project.description || '',
        ownerId: project.owner_id,
        createdAt: new Date(project.created_at),
        lastAccessed: project.last_accessed ? new Date(project.last_accessed) : undefined,
        // If there's a role from project_members, use that
        role: project.project_members?.length > 0 ? project.project_members[0].role : undefined
      };
    });

    console.log("Fetched total projects:", projectsList.length);
    return projectsList;
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
