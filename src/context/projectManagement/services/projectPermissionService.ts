
import { ref, get, query, orderByChild, equalTo } from "firebase/database";
import { database, auth } from "@/lib/firebase";
import { toast } from "sonner";

/**
 * Prüft, ob der aktuelle Benutzer Besitzer eines Projekts ist
 */
export const isProjectOwner = async (projectId: string): Promise<boolean> => {
  if (!auth.currentUser) return false;
  
  try {
    // Projekt abrufen
    const projectRef = ref(database, `projects/${projectId}`);
    const projectSnapshot = await get(projectRef);
    
    if (!projectSnapshot.exists()) {
      return false;
    }
    
    const project = projectSnapshot.val();
    return project.ownerId === auth.currentUser.uid;
  } catch (error) {
    console.error("Error checking project ownership:", error);
    return false;
  }
};

/**
 * Prüft, ob der aktuelle Benutzer ein Editor für das Projekt ist
 */
export const isProjectEditor = async (projectId: string): Promise<boolean> => {
  if (!auth.currentUser) return false;
  
  // Zuerst Besitzer prüfen, da Besitzer automatisch alle Berechtigungen haben
  if (await isProjectOwner(projectId)) {
    return true;
  }
  
  try {
    // Member-Einträge für diesen Benutzer und dieses Projekt suchen
    const membersRef = ref(database, 'projectMembers');
    // Wir müssen leider mehrere Abfragen verketten, da Firebase nur begrenzte Abfragemöglichkeiten bietet
    const userMembersQuery = query(membersRef, orderByChild('userId'), equalTo(auth.currentUser.uid));
    const userMembersSnapshot = await get(userMembersQuery);
    
    if (!userMembersSnapshot.exists()) {
      return false;
    }
    
    // Über alle Mitgliedschaftseinträge iterieren und prüfen
    let isEditor = false;
    userMembersSnapshot.forEach((childSnapshot) => {
      const member = childSnapshot.val();
      if (member.projectId === projectId && member.role === "editor") {
        isEditor = true;
      }
    });
    
    return isEditor;
  } catch (error) {
    console.error("Error checking editor permissions:", error);
    return false;
  }
};

/**
 * Prüft, ob der aktuelle Benutzer mindestens Leserechte für das Projekt hat
 */
export const canViewProject = async (projectId: string): Promise<boolean> => {
  if (!auth.currentUser) return false;
  
  // Zuerst Besitzer prüfen
  if (await isProjectOwner(projectId)) {
    return true;
  }
  
  try {
    // Member-Einträge für diesen Benutzer und dieses Projekt suchen
    const membersRef = ref(database, 'projectMembers');
    const userMembersQuery = query(membersRef, orderByChild('userId'), equalTo(auth.currentUser.uid));
    const userMembersSnapshot = await get(userMembersQuery);
    
    if (!userMembersSnapshot.exists()) {
      return false;
    }
    
    // Über alle Mitgliedschaftseinträge iterieren und prüfen
    let canView = false;
    userMembersSnapshot.forEach((childSnapshot) => {
      const member = childSnapshot.val();
      if (member.projectId === projectId) {
        canView = true;
      }
    });
    
    return canView;
  } catch (error) {
    console.error("Error checking view permissions:", error);
    return false;
  }
};

/**
 * Wrapper-Funktion zum Ausführen mit Berechtigungsprüfung
 * @param projectId Die Projekt-ID
 * @param requiresEdit Ob Bearbeitungsberechtigungen erforderlich sind
 * @param action Die auszuführende Aktion wenn berechtigt
 * @param errorMessage Fehlermeldung bei fehlender Berechtigung
 */
export const withProjectPermission = async <T>(
  projectId: string,
  requiresEdit: boolean,
  action: () => Promise<T>,
  errorMessage: string = "Keine ausreichenden Berechtigungen"
): Promise<T> => {
  if (!auth.currentUser) {
    toast.error("Nicht angemeldet");
    throw new Error("Not authenticated");
  }
  
  // Berechtigungsprüfung
  const hasPermission = requiresEdit 
    ? await isProjectEditor(projectId)
    : await canViewProject(projectId);
  
  if (!hasPermission) {
    toast.error(errorMessage);
    throw new Error(errorMessage);
  }
  
  // Aktion ausführen wenn berechtigt
  return action();
};

/**
 * Funktion zum Import in den index.ts der Services
 */
export const initPermissionService = () => {
  console.log("Permission service initialized");
};
