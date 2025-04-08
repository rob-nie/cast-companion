
import { 
  ref, 
  query,
  orderByChild,
  equalTo,
  onValue,
  get,
  off
} from "firebase/database";
import { database } from "@/lib/firebase";
import { ProjectMember } from "@/types/user";
import { SetMembersFunction } from "../serviceTypes";

export const fetchProjectMembers = async (
  projectId: string, 
  setMembers: SetMembersFunction
) => {
  try {
    // Optimierte Abfrage mit Index für projektMitglieder
    const membersQuery = query(
      ref(database, 'projectMembers'),
      orderByChild('projectId'),
      equalTo(projectId)
    );
    
    // Einmaliges Laden zur sofortigen Anzeige
    const snapshot = await get(membersQuery);
    const initialMembers = await processMembers(snapshot);
    setMembers(projectId, initialMembers);
    
    // Echtzeitaktualisierungen abonnieren
    const unsubscribe = onValue(membersQuery, async (snapshot) => {
      try {
        const updatedMembers = await processMembers(snapshot);
        setMembers(projectId, updatedMembers);
      } catch (error) {
        console.error("Fehler bei der Verarbeitung der Mitgliederdaten:", error);
        setMembers(projectId, []);
      }
    }, (error) => {
      console.error("Fehler beim Laden der Projektmitglieder:", error);
      setMembers(projectId, []);
    });
    
    // Aufräumfunktion zurückgeben
    return () => {
      try {
        off(membersQuery);
        unsubscribe();
      } catch (error) {
        console.error("Fehler beim Aufräumen der Mitgliederabfrage:", error);
      }
    };
  } catch (error) {
    console.error("Fehler beim Abrufen der Projektmitglieder:", error);
    setMembers(projectId, []);
    return () => {};
  }
};

// Hilfsfunktion zur Verarbeitung von Mitgliedsdaten mit Benutzerdetails
async function processMembers(snapshot: any): Promise<ProjectMember[]> {
  if (!snapshot.exists()) {
    return [];
  }
  
  const members: ProjectMember[] = [];
  const membersData = snapshot.val();
  const userDetailsCache: Record<string, any> = {};
  
  // Benutzer-IDs sammeln
  const userIds = new Set<string>();
  for (const key in membersData) {
    const member = membersData[key];
    userIds.add(member.userId);
  }
  
  // Benutzerdetails in einem Batch laden
  for (const userId of userIds) {
    try {
      const userRef = ref(database, `users/${userId}`);
      const userSnapshot = await get(userRef);
      
      if (userSnapshot.exists()) {
        userDetailsCache[userId] = userSnapshot.val();
      }
    } catch (error) {
      console.error(`Fehler beim Laden der Benutzerdetails für ${userId}:`, error);
    }
  }
  
  // Mitgliedsdaten mit Benutzerdetails zusammenführen
  for (const key in membersData) {
    const member = membersData[key];
    const userData = userDetailsCache[member.userId] || {};
    
    members.push({
      userId: member.userId,
      projectId: member.projectId,
      role: member.role,
      name: userData.name || "Unbekannter Benutzer",
      email: userData.email || "",
      avatar: userData.avatar
    });
  }
  
  return members;
}
