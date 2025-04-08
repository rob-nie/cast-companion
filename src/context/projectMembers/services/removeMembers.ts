
import { 
  ref,
  remove,
  get
} from "firebase/database";
import { database } from "@/lib/firebase";
import { toast } from "sonner";

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
