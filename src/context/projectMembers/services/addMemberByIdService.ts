
import { 
  ref, 
  push,
  set,
  get 
} from "firebase/database";
import { database } from "@/lib/firebase";
import { UserRole } from "../types";
import { toast } from "sonner";
import { isProjectOwner } from "@/context/projectManagement/services/permissions";

export const addMemberToProjectById = async (projectId: string, userId: string, role: UserRole) => {
  try {
    // Überprüfen, ob der aktuelle Benutzer der Eigentümer des Projekts ist
    const isOwner = await isProjectOwner(projectId);
    if (!isOwner) {
      toast.error("Nur der Projektinhaber kann Mitglieder hinzufügen");
      throw new Error("Insufficient permissions");
    }

    // Get user data
    const userRef = ref(database, `users/${userId}`);
    const userSnapshot = await get(userRef);
    
    if (!userSnapshot.exists()) {
      toast.error("Benutzer nicht gefunden");
      throw new Error("Benutzer nicht gefunden");
    }
    
    const userData = userSnapshot.val();
    
    // Check if user is already a member
    const membersRef = ref(database, 'projectMembers');
    const memberQuery = ref(database, `projectMembers`);
    const memberSnapshot = await get(memberQuery);
    let isAlreadyMember = false;
    
    if (memberSnapshot.exists()) {
      memberSnapshot.forEach((childSnapshot) => {
        const memberData = childSnapshot.val();
        if (memberData.userId === userId && memberData.projectId === projectId) {
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
    
    toast.success(`${userData.name || userId} wurde zum Projekt hinzugefügt`);
    
  } catch (error: any) {
    console.error("Failed to add member by ID:", error);
    if (!error.message.includes("bereits Mitglied") && !error.message.includes("nicht gefunden") && !error.message.includes("Insufficient permissions")) {
      toast.error("Fehler beim Hinzufügen des Mitglieds");
    }
    throw error;
  }
};
