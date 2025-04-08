
import { 
  ref, 
  push,
  set,
  remove, 
  update,
  query,
  orderByChild,
  equalTo,
  onValue,
  get 
} from "firebase/database";
import { database } from "@/lib/firebase";
import { ProjectMember } from "@/types/user";
import { UserRole } from "./types";
import { toast } from "sonner";

export const fetchProjectMembers = async (projectId: string, 
  setMembers: (projectId: string, members: ProjectMember[]) => void) => {
  try {
    const membersRef = ref(database, 'projectMembers');
    const membersQuery = query(membersRef, orderByChild('projectId'), equalTo(projectId));
    
    onValue(membersQuery, async (snapshot) => {
      if (!snapshot.exists()) {
        setMembers(projectId, []);
        return;
      }
      
      const members: ProjectMember[] = [];
      const membersData = snapshot.val();
      
      for (const key in membersData) {
        const member = membersData[key];
        
        // Get user details
        const userRef = ref(database, `users/${member.userId}`);
        const userSnapshot = await get(userRef);
        
        if (userSnapshot.exists()) {
          const userData = userSnapshot.val();
          members.push({
            userId: member.userId,
            projectId: member.projectId,
            role: member.role,
            name: userData.name || "Unknown User",
            email: userData.email || "",
            avatar: userData.avatar
          });
        }
      }
      
      setMembers(projectId, members);
    });
  } catch (error) {
    console.error("Error getting project members:", error);
    setMembers(projectId, []);
  }
};

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

export const removeMemberFromProject = async (projectId: string, userId: string) => {
  try {
    // Da wir keinen Index für userId haben, müssen wir alle Mitglieder abrufen und lokal filtern
    const membersRef = ref(database, 'projectMembers');
    const snapshot = await get(membersRef);
    let memberKey = "";
    let memberRole = "";
    
    if (snapshot.exists()) {
      // Lokal nach Mitgliedschaft suchen
      const membersData = snapshot.val();
      for (const key in membersData) {
        const memberData = membersData[key];
        if (memberData.projectId === projectId && memberData.userId === userId) {
          memberKey = key;
          memberRole = memberData.role;
          break;
        }
      }
    }
    
    if (!memberKey) {
      toast.error("Mitglied nicht gefunden");
      throw new Error("Mitglied nicht gefunden");
    }
    
    // Check if removing owner
    if (memberRole === "owner") {
      toast.error("Der Projektinhaber kann nicht entfernt werden");
      throw new Error("Der Projektinhaber kann nicht entfernt werden");
    }
    
    // Remove member
    await remove(ref(database, `projectMembers/${memberKey}`));
    toast.success("Mitglied entfernt");
  } catch (error: any) {
    if (!error.message.includes("nicht gefunden") && !error.message.includes("Projektinhaber")) {
      toast.error("Fehler beim Entfernen des Mitglieds");
    }
    throw error;
  }
};

export const updateMemberRole = async (projectId: string, userId: string, role: UserRole) => {
  try {
    // Da wir keinen Index für userId haben, müssen wir alle Mitglieder abrufen und lokal filtern
    const membersRef = ref(database, 'projectMembers');
    const snapshot = await get(membersRef);
    let memberKey = "";
    
    if (snapshot.exists()) {
      // Lokal nach Mitgliedschaft suchen
      const membersData = snapshot.val();
      for (const key in membersData) {
        const memberData = membersData[key];
        if (memberData.projectId === projectId && memberData.userId === userId) {
          memberKey = key;
          break;
        }
      }
    }
    
    if (!memberKey) {
      toast.error("Mitglied nicht gefunden");
      throw new Error("Mitglied nicht gefunden");
    }
    
    // Update role
    await update(ref(database, `projectMembers/${memberKey}`), { role });
    toast.success("Rolle aktualisiert");
  } catch (error) {
    toast.error("Fehler beim Aktualisieren der Rolle");
    throw error;
  }
};
