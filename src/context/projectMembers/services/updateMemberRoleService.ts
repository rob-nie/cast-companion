
import { 
  ref, 
  update,
  query,
  orderByChild,
  equalTo,
  get 
} from "firebase/database";
import { database } from "@/lib/firebase";
import { UserRole } from "../types";
import { toast } from "sonner";
import { isProjectOwner } from "@/context/projectManagement/services/projectPermissionService";

export const updateMemberRole = async (projectId: string, userId: string, role: UserRole) => {
  try {
    // Überprüfen, ob der aktuelle Benutzer der Eigentümer des Projekts ist
    const isOwner = await isProjectOwner(projectId);
    if (!isOwner) {
      toast.error("Nur der Projektinhaber kann Rollen ändern");
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
    
  } catch (error: any) {
    if (!error.message.includes("Insufficient permissions")) {
      toast.error("Fehler beim Aktualisieren der Rolle");
    }
    throw error;
  }
};
