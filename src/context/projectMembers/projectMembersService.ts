
import { supabase } from "@/integrations/supabase/client";
import { ProjectMember, UserRole } from "@/types/user";
import { toast } from "sonner";

/**
 * Lädt alle Mitglieder eines Projekts
 */
export const fetchProjectMembers = async (projectId: string): Promise<ProjectMember[]> => {
  try {
    // Überprüfen, ob der Benutzer angemeldet ist
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.warn("Kein authentifizierter Benutzer gefunden");
      return [];
    }
    
    // Projekt-Mitglieder mit zugehörigen Profildaten laden
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

    if (error) {
      console.error("Fehler beim Laden der Projektmitglieder:", error);
      throw error;
    }

    if (!data || data.length === 0) return [];
    
    // Daten in das erwartete Format transformieren
    return data.map(item => {
      // Profildaten sicher extrahieren
      const profile = item.profiles as { name?: string; email?: string; avatar?: string } | null;
      
      return {
        userId: item.user_id,
        projectId: item.project_id,
        role: item.role as UserRole,
        name: profile?.name || 'Unbekannter Benutzer',
        email: profile?.email || '',
        avatar: profile?.avatar
      };
    });
  } catch (error) {
    console.error("Fehler beim Laden der Projektmitglieder:", error);
    toast.error("Fehler beim Laden der Projektmitglieder");
    throw error;
  }
};

/**
 * Benutzer anhand der E-Mail-Adresse finden
 */
export const findUserByEmail = async (email: string) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, email')
      .eq('email', email)
      .single();
      
    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Kein Ergebnis gefunden
      }
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error("Fehler beim Suchen des Benutzers:", error);
    throw error;
  }
};

/**
 * Mitglied zu einem Projekt hinzufügen
 */
export const addMemberByEmail = async (
  projectId: string, 
  email: string, 
  role: UserRole
): Promise<ProjectMember | null> => {
  try {
    // Benutzer anhand der E-Mail suchen
    const userData = await findUserByEmail(email);
    
    if (!userData) {
      toast.error("Benutzer nicht gefunden");
      throw new Error("Benutzer nicht gefunden");
    }
    
    // Prüfen, ob Benutzer bereits Mitglied ist
    const { data: existingMember, error: checkError } = await supabase
      .from('project_members')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', userData.id)
      .single();
    
    if (existingMember) {
      toast.error("Benutzer ist bereits Mitglied dieses Projekts");
      throw new Error("Benutzer ist bereits Mitglied dieses Projekts");
    }
    
    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }
    
    // Benutzer zum Projekt hinzufügen
    const { error } = await supabase
      .from('project_members')
      .insert({
        project_id: projectId,
        user_id: userData.id,
        role
      });
      
    if (error) {
      console.error("Fehler beim Hinzufügen des Mitglieds:", error);
      
      if (error.code === '23505') { // Unique constraint violation
        toast.error("Benutzer ist bereits Mitglied dieses Projekts");
      } else {
        toast.error(error.message || "Fehler beim Hinzufügen des Mitglieds");
      }
      
      throw error;
    }
    
    toast.success(`${userData.name} wurde zum Projekt hinzugefügt`);
    return {
      userId: userData.id,
      projectId,
      role,
      name: userData.name,
      email: userData.email,
      avatar: undefined
    };
  } catch (error) {
    console.error("Fehler beim Hinzufügen des Mitglieds:", error);
    throw error;
  }
};

/**
 * Mitglied per Benutzer-ID zu einem Projekt hinzufügen
 */
export const addMemberByUserId = async (
  projectId: string, 
  userId: string, 
  role: UserRole
): Promise<ProjectMember | null> => {
  try {
    // Benutzerdaten laden
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('id, name, email, avatar')
      .eq('id', userId)
      .single();
    
    if (userError || !userData) {
      toast.error("Benutzer nicht gefunden");
      throw new Error("Benutzer nicht gefunden");
    }
    
    // Prüfen, ob Benutzer bereits Mitglied ist
    const { data: existingMember, error: checkError } = await supabase
      .from('project_members')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .single();
    
    if (existingMember) {
      toast.error("Benutzer ist bereits Mitglied dieses Projekts");
      throw new Error("Benutzer ist bereits Mitglied dieses Projekts");
    }
    
    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }
    
    // Benutzer zum Projekt hinzufügen
    const { error } = await supabase
      .from('project_members')
      .insert({
        project_id: projectId,
        user_id: userId,
        role
      });
      
    if (error) {
      toast.error(error.message || "Fehler beim Hinzufügen des Mitglieds");
      throw error;
    }
    
    toast.success(`${userData.name} wurde zum Projekt hinzugefügt`);
    return {
      userId,
      projectId,
      role,
      name: userData.name,
      email: userData.email,
      avatar: userData.avatar
    };
  } catch (error) {
    console.error("Fehler beim Hinzufügen des Mitglieds:", error);
    throw error;
  }
};

/**
 * Die Rolle eines Mitglieds in einem Projekt aktualisieren
 */
export const updateMemberRole = async (
  projectId: string, 
  userId: string, 
  role: UserRole
): Promise<boolean> => {
  try {
    // Prüfen, ob der Benutzer der Projekteigentümer ist
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('owner_id')
      .eq('id', projectId)
      .single();
      
    if (projectError) {
      toast.error("Projekt nicht gefunden");
      throw projectError;
    }
    
    // Die Rolle des Eigentümers kann nicht geändert werden
    if (projectData.owner_id === userId && role !== 'owner') {
      toast.error("Die Rolle des Eigentümers kann nicht geändert werden");
      throw new Error("Die Rolle des Eigentümers kann nicht geändert werden");
    }
    
    // Mitgliederrolle aktualisieren
    const { error } = await supabase
      .from('project_members')
      .update({ role })
      .eq('project_id', projectId)
      .eq('user_id', userId);
      
    if (error) {
      toast.error(error.message || "Fehler beim Aktualisieren der Rolle");
      throw error;
    }
    
    toast.success("Rolle erfolgreich aktualisiert");
    return true;
  } catch (error) {
    console.error("Fehler beim Aktualisieren der Rolle:", error);
    throw error;
  }
};

/**
 * Ein Mitglied aus einem Projekt entfernen
 */
export const removeMember = async (
  projectId: string, 
  userId: string
): Promise<boolean> => {
  try {
    // Prüfen, ob der Benutzer der Projekteigentümer ist
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('owner_id')
      .eq('id', projectId)
      .single();
      
    if (projectError) {
      toast.error("Projekt nicht gefunden");
      throw projectError;
    }
    
    // Der Eigentümer kann nicht entfernt werden
    if (projectData.owner_id === userId) {
      toast.error("Der Projekteigentümer kann nicht entfernt werden");
      throw new Error("Der Projekteigentümer kann nicht entfernt werden");
    }
    
    // Den Benutzer aus dem Projekt entfernen
    const { error } = await supabase
      .from('project_members')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', userId);
      
    if (error) {
      toast.error(error.message || "Fehler beim Entfernen des Mitglieds");
      throw error;
    }
    
    toast.success("Mitglied erfolgreich entfernt");
    return true;
  } catch (error) {
    console.error("Fehler beim Entfernen des Mitglieds:", error);
    throw error;
  }
};

// Exportiere alle Funktionen
export {
  addMemberByEmail as addMemberToProject,
  addMemberByUserId as addMemberToProjectByUserId,
  removeMember as removeMemberFromProject
};
