
import { 
  ref, 
  push,
  set,
  get 
} from "firebase/database";
import { database } from "@/lib/firebase";
import { UserRole } from "@/types/user";
import { toast } from "sonner";

export const addMemberToProjectByUserId = async (projectId: string, userId: string, role: UserRole) => {
  try {
    // Check if user exists
    const userRef = ref(database, `users/${userId}`);
    const userSnapshot = await get(userRef);
    
    if (!userSnapshot.exists()) {
      toast.error("Benutzer nicht gefunden");
      throw new Error("Benutzer nicht gefunden");
    }
    
    const userData = userSnapshot.val();
    
    // Da wir keinen Index für userId haben, müssen wir alle Mitglieder abrufen und lokal filtern
    const membersRef = ref(database, 'projectMembers');
    const snapshot = await get(membersRef);
    let isAlreadyMember = false;
    
    if (snapshot.exists()) {
      // Lokal nach Mitgliedschaft suchen
      const membersData = snapshot.val();
      for (const key in membersData) {
        const memberData = membersData[key];
        if (memberData.projectId === projectId && memberData.userId === userId) {
          isAlreadyMember = true;
          break;
        }
      }
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
    
    toast.success(`${userData.name || "Benutzer"} wurde zum Projekt hinzugefügt`);
  } catch (error: any) {
    console.error("Failed to add member by ID:", error);
    if (!error.message.includes("bereits Mitglied") && !error.message.includes("nicht gefunden")) {
      toast.error("Fehler beim Hinzufügen des Mitglieds");
    }
    throw error;
  }
};

export const addMemberToProject = async (projectId: string, email: string, role: UserRole) => {
  try {
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
    
    // Da wir keinen Index für userId haben, müssen wir alle Mitglieder abrufen und lokal filtern
    const membersRef = ref(database, 'projectMembers');
    const memberSnapshot = await get(membersRef);
    let isAlreadyMember = false;
    
    if (memberSnapshot.exists()) {
      // Lokal nach Mitgliedschaft suchen
      const membersData = memberSnapshot.val();
      for (const key in membersData) {
        const memberData = membersData[key];
        if (memberData.projectId === projectId && memberData.userId === userId) {
          isAlreadyMember = true;
          break;
        }
      }
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
    if (!error.message.includes("bereits Mitglied") && !error.message.includes("nicht gefunden")) {
      toast.error("Fehler beim Hinzufügen des Mitglieds");
    }
    throw error;
  }
};
