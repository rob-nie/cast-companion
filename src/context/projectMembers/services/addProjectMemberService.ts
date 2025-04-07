
import { 
  ref, 
  push,
  set,
  query,
  orderByChild,
  equalTo,
  get 
} from "firebase/database";
import { database } from "@/lib/firebase";
import { UserRole } from "../types";
import { toast } from "sonner";
import { isProjectOwner } from "@/context/projectManagement/services/projectPermissionService";

export const addMemberToProject = async (projectId: string, email: string, role: UserRole) => {
  try {
    // Überprüfen, ob der aktuelle Benutzer der Eigentümer des Projekts ist
    const isOwner = await isProjectOwner(projectId);
    if (!isOwner) {
      toast.error("Nur der Projektinhaber kann Mitglieder hinzufügen");
      throw new Error("Insufficient permissions");
    }

    // Get all users and filter locally
    const usersRef = ref(database, 'users');
    const snapshot = await get(usersRef);
    
    if (!snapshot.exists()) {
      toast.error("Keine Benutzer gefunden");
      throw new Error("Keine Benutzer gefunden");
    }
    
    // Search for the email on client side
    let userId = "";
    let userData = null;
    let userFound = false;
    
    snapshot.forEach((childSnapshot) => {
      const user = childSnapshot.val();
      if (user.email === email) {
        userId = childSnapshot.key || "";
        userData = user;
        userFound = true;
      }
    });
    
    if (!userFound || !userId) {
      toast.error("Benutzer nicht gefunden");
      throw new Error("Benutzer nicht gefunden");
    }
    
    // Check if user is already a member
    const membersRef = ref(database, 'projectMembers');
    const memberQuery = query(
      membersRef,
      orderByChild('userId'),
      equalTo(userId)
    );
    
    const memberSnapshot = await get(memberQuery);
    let isAlreadyMember = false;
    
    if (memberSnapshot.exists()) {
      memberSnapshot.forEach((childSnapshot) => {
        const memberData = childSnapshot.val();
        if (memberData.projectId === projectId) {
          isAlreadyMember = true;
        }
      });
    }
    
    if (isAlreadyMember) {
      toast.error("Benutzer ist bereits Mitglied dieses Projekts");
      throw new Error("Benutzer ist bereits Mitglied dieses Projekts");
    }
    
    // Add member to project
    const newMemberRef = push(ref(database, 'projectMembers'));
    await set(newMemberRef, {
      userId,
      projectId,
      role
    });
    
    toast.success(`${userData.name} wurde zum Projekt hinzugefügt`);
    
  } catch (error: any) {
    console.error("Failed to add member:", error);
    if (!error.message.includes("bereits Mitglied") && !error.message.includes("nicht gefunden") && !error.message.includes("Insufficient permissions")) {
      toast.error("Fehler beim Hinzufügen des Mitglieds");
    }
    throw error;
  }
};
