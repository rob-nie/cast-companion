
import { 
  ref, 
  remove,
  query,
  orderByChild,
  equalTo,
  get 
} from "firebase/database";
import { database } from "@/lib/firebase";
import { toast } from "sonner";
import { isProjectOwner } from "@/context/projectManagement/services/projectPermissionService";

export const removeMemberFromProject = async (projectId: string, userId: string) => {
  try {
    // Überprüfen, ob der aktuelle Benutzer der Eigentümer des Projekts ist
    const isOwner = await isProjectOwner(projectId);
    if (!isOwner) {
      toast.error("Nur der Projektinhaber kann Mitglieder entfernen");
      throw new Error("Insufficient permissions");
    }

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
    if (!error.message.includes("nicht gefunden") && !error.message.includes("Projektinhaber") && !error.message.includes("Insufficient permissions")) {
      toast.error("Fehler beim Entfernen des Mitglieds");
    }
    throw error;
  }
};
