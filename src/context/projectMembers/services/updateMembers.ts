
import { 
  ref,
  update,
  get
} from "firebase/database";
import { database } from "@/lib/firebase";
import { UserRole } from "@/types/user";
import { toast } from "sonner";

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
