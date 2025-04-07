
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
        try {
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
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
      
      setMembers(projectId, members);
    });
  } catch (error) {
    console.error("Error getting project members:", error);
    setMembers(projectId, []);
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
    if (!error.message.includes("bereits Mitglied") && !error.message.includes("nicht gefunden")) {
      toast.error("Fehler beim Hinzufügen des Mitglieds");
    }
    throw error;
  }
};

export const removeMemberFromProject = async (projectId: string, userId: string) => {
  try {
    // Find the member entry
    const membersRef = ref(database, 'projectMembers');
    const memberQuery = query(
      membersRef,
      orderByChild('userId'),
      equalTo(userId)
    );
    
    const snapshot = await get(memberQuery);
    let memberKey = "";
    let memberRole = "";
    
    snapshot.forEach((childSnapshot) => {
      const memberData = childSnapshot.val();
      if (memberData.projectId === projectId) {
        memberKey = childSnapshot.key || "";
        memberRole = memberData.role;
      }
    });
    
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
    // Find the member entry
    const membersRef = ref(database, 'projectMembers');
    const memberQuery = query(
      membersRef,
      orderByChild('userId'),
      equalTo(userId)
    );
    
    const snapshot = await get(memberQuery);
    let memberKey = "";
    
    snapshot.forEach((childSnapshot) => {
      const memberData = childSnapshot.val();
      if (memberData.projectId === projectId) {
        memberKey = childSnapshot.key || "";
      }
    });
    
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
