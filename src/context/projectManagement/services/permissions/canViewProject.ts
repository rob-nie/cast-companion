
import { ref, get, query, orderByChild, equalTo } from "firebase/database";
import { database, auth } from "@/lib/firebase";
import { isProjectOwner } from "./isProjectOwner";

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
