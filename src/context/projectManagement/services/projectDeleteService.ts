
import { ref, remove, get } from "firebase/database";
import { database, auth } from "@/lib/firebase";
import { toast } from "sonner";

/**
 * Deletes a project from Firebase
 */
export const deleteProjectService = async (id: string, ownerId: string) => {
  if (!auth.currentUser) {
    toast.error("Du musst angemeldet sein, um ein Projekt zu löschen");
    throw new Error("Not authenticated");
  }
  
  // Check if user is the owner or has rights to delete
  if (ownerId !== auth.currentUser.uid) {
    toast.error("Du hast keine Berechtigung, dieses Projekt zu löschen");
    throw new Error("Permission denied");
  }
  
  try {
    const projectRef = ref(database, `projects/${id}`);
    await remove(projectRef);
    
    toast.success("Projekt gelöscht");
    
    // Also remove project members entries
    await cleanupProjectData(id);
  } catch (error) {
    console.error("Error deleting project:", error);
    toast.error("Fehler beim Löschen des Projekts");
    throw error;
  }
};

/**
 * Helper function to clean up related data when a project is deleted
 */
const cleanupProjectData = async (projectId: string) => {
  try {
    // Remove project members
    const membersRef = ref(database, 'projectMembers');
    const membersSnapshot = await get(membersRef);
    if (membersSnapshot.exists()) {
      const membersData = membersSnapshot.val();
      Object.keys(membersData).forEach(async (key) => {
        if (membersData[key].projectId === projectId) {
          await remove(ref(database, `projectMembers/${key}`));
        }
      });
    }
    
    // Remove notes
    const notesRef = ref(database, 'notes');
    const notesSnapshot = await get(notesRef);
    if (notesSnapshot.exists()) {
      const notesData = notesSnapshot.val();
      Object.keys(notesData).forEach(async (key) => {
        if (notesData[key].projectId === projectId) {
          await remove(ref(database, `notes/${key}`));
        }
      });
    }
  } catch (error) {
    console.error("Error cleaning up project data:", error);
  }
};
