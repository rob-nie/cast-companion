import { supabase } from "@/integrations/supabase/client";
import { Project } from "./types";
import { toast } from "sonner";

/**
 * Lädt alle Projekte des aktuellen Benutzers
 * Berücksichtigt sowohl eigene als auch geteilte Projekte
 */
export const fetchUserProjects = async (): Promise<Project[]> => {
  try {
    console.log("Lade Projekte für den aktuellen Benutzer...");
    
    // Überprüfen, ob der Benutzer angemeldet ist
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.warn("Kein authentifizierter Benutzer gefunden");
      return [];
    }

    // Laden aller eigenen Projekte
    const { data: projects, error } = await supabase
      .from('projects')
      .select(`
        id,
        title,
        description,
        owner_id,
        created_at,
        last_accessed
      `)
      .order('last_accessed', { ascending: false, nullsFirst: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Fehler beim Laden der Projekte:", error);
      throw error;
    }
    
    // Lade Projektrollen für geteilte Projekte
    const { data: memberRoles, error: memberError } = await supabase
      .from('project_members')
      .select('project_id, role')
      .eq('user_id', session.user.id);
      
    if (memberError) {
      console.error("Fehler beim Laden der Mitgliederrollen:", memberError);
      // Wir fahren trotzdem fort, da wir zumindest die Projekte haben
    }
    
    // Mapping der Rollen zu Projekten
    const roleMap = new Map();
    if (memberRoles) {
      memberRoles.forEach(member => {
        roleMap.set(member.project_id, member.role);
      });
    }
    
    // Transformiere die Daten in das erwartete Format
    const formattedProjects = (projects || []).map(project => {
      const isOwner = project.owner_id === session.user.id;
      return {
        id: project.id,
        title: project.title,
        description: project.description || '',
        ownerId: project.owner_id,
        createdAt: new Date(project.created_at),
        lastAccessed: project.last_accessed ? new Date(project.last_accessed) : undefined,
        role: isOwner ? 'owner' : roleMap.get(project.id) || 'viewer'
      };
    });

    console.log(`${formattedProjects.length} Projekte geladen`);
    return formattedProjects;
  } catch (error) {
    console.error("Fehler beim Laden der Projekte:", error);
    toast.error("Fehler beim Laden der Projekte. Bitte versuchen Sie es später erneut.");
    throw error;
  }
};

/**
 * Erstellt ein neues Projekt für den aktuellen Benutzer
 */
export const createProject = async (project: Omit<Project, "id" | "createdAt" | "ownerId" | "role">): Promise<Project> => {
  try {
    // Session des aktuellen Benutzers laden
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    
    if (!user) {
      throw new Error("Kein authentifizierter Benutzer gefunden");
    }

    const { data, error } = await supabase
      .from('projects')
      .insert({
        title: project.title,
        description: project.description,
        owner_id: user.id,
        last_accessed: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error("Fehler beim Erstellen des Projekts:", error);
      throw error;
    }

    return {
      id: data.id,
      title: data.title,
      description: data.description || '',
      ownerId: data.owner_id,
      createdAt: new Date(data.created_at),
      lastAccessed: data.last_accessed ? new Date(data.last_accessed) : undefined
    };
  } catch (error) {
    console.error("Fehler beim Erstellen des Projekts:", error);
    toast.error("Projekt konnte nicht erstellt werden");
    throw error;
  }
};

/**
 * Aktualisiert ein bestehendes Projekt
 */
export const updateProject = async (
  id: string, 
  projectUpdate: Partial<Project>, 
  silent: boolean = false
): Promise<Project> => {
  try {
    const updateObj: Record<string, any> = {};
    
    if (projectUpdate.title !== undefined) {
      updateObj.title = projectUpdate.title;
    }
    
    if (projectUpdate.description !== undefined) {
      updateObj.description = projectUpdate.description;
    }
    
    if (projectUpdate.lastAccessed) {
      updateObj.last_accessed = new Date().toISOString();
    }
    
    const { data, error } = await supabase
      .from('projects')
      .update(updateObj)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (!silent) {
        console.error("Fehler beim Aktualisieren des Projekts:", error);
        toast.error("Projekt konnte nicht aktualisiert werden");
      }
      throw error;
    }

    return {
      id: data.id,
      title: data.title,
      description: data.description || '',
      ownerId: data.owner_id,
      createdAt: new Date(data.created_at),
      lastAccessed: data.last_accessed ? new Date(data.last_accessed) : undefined
    };
  } catch (error) {
    console.error("Fehler beim Aktualisieren des Projekts:", error);
    if (!silent) {
      toast.error("Projekt konnte nicht aktualisiert werden");
    }
    throw error;
  }
};

/**
 * Löscht ein Projekt
 */
export const deleteProject = async (id: string): Promise<boolean> => {
  try {
    // Überprüfen, ob der aktuelle Benutzer Eigentümer ist
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Nicht angemeldet");
      return false;
    }
    
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('owner_id')
      .eq('id', id)
      .single();
      
    if (projectError) {
      console.error("Fehler beim Laden des Projekts:", projectError);
      toast.error("Projekt konnte nicht geladen werden");
      return false;
    }
    
    if (project.owner_id !== session.user.id) {
      toast.error("Sie haben keine Berechtigung, dieses Projekt zu löschen");
      return false;
    }
    
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Fehler beim Löschen des Projekts:", error);
      toast.error("Projekt konnte nicht gelöscht werden");
      return false;
    }

    toast.success("Projekt erfolgreich gelöscht");
    return true;
  } catch (error) {
    console.error("Fehler beim Löschen des Projekts:", error);
    toast.error("Projekt konnte nicht gelöscht werden");
    return false;
  }
};
