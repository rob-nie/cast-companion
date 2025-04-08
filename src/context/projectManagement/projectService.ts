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

    // Fetch projects the user owns
    const { data: ownedProjects, error: ownedError } = await supabase
      .from('projects')
      .select('*')
      .eq('owner_id', session.user.id);

    if (ownedError) {
      console.error("Error fetching owned projects:", ownedError);
      throw ownedError;
    }

    // Fetch projects the user is a member of (but doesn't own)
    const { data: memberProjects, error: memberError } = await supabase
      .from('project_members')
      .select(`
        project_id,
        role,
        projects!inner (*)
      `)
      .eq('user_id', session.user.id)
      .neq('role', 'owner');

    if (memberError) {
      console.error("Error fetching member projects:", memberError);
      throw memberError;
    }

    // Process owned projects
    const ownedProjectsList = ownedProjects.map(project => {
      return {
        id: project.id,
        title: project.title,
        description: project.description || '',
        ownerId: project.owner_id,
        createdAt: new Date(project.created_at),
        lastAccessed: project.last_accessed ? new Date(project.last_accessed) : undefined,
      };
    });

    // Process projects where the user is a member
    const memberProjectsList = memberProjects
      .filter(item => item.projects) // Filter out any null projects
      .map(item => {
        const project = item.projects;
        return {
          id: project.id,
          title: project.title,
          description: project.description || '',
          ownerId: project.owner_id,
          createdAt: new Date(project.created_at),
          lastAccessed: project.last_accessed ? new Date(project.last_accessed) : undefined,
          role: item.role,
        };
      });

    console.log("Fetched owned projects:", ownedProjectsList.length);
    console.log("Fetched member projects:", memberProjectsList.length);

    // Combine the lists, avoiding duplicates
    const allProjects = [
      ...ownedProjectsList,
      ...memberProjectsList.filter(p => !ownedProjectsList.some(op => op.id === p.id))
    ];

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
