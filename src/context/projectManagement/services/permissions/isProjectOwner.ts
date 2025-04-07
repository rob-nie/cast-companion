
import { ref, get } from "firebase/database";
import { database, auth } from "@/lib/firebase";

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
