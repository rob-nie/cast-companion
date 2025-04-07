
import { ref, get, query, orderByChild, equalTo } from "firebase/database";
import { database, auth } from "@/lib/firebase";
import { isProjectOwner } from "./isProjectOwner";

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
