
import { ref, update } from "firebase/database";
import { database, auth } from "@/lib/firebase";
import { Project } from "../types";
import { toast } from "sonner";
import { withProjectPermission } from "./projectPermissionService";

/**
 * Updates an existing project in Firebase
 */
export const updateProjectService = async (
  id: string, 
  projectUpdate: Partial<Project>, 
  silent: boolean = false
) => {
  if (!auth.currentUser) {
    toast.error("Du musst angemeldet sein, um ein Projekt zu aktualisieren");
    throw new Error("Not authenticated");
  }
  
  // Prepare data for Firebase
  const updateData: Record<string, any> = { ...projectUpdate };
  
  // Convert Date objects to ISO strings for Firebase
  if (updateData.createdAt instanceof Date) {
    updateData.createdAt = updateData.createdAt.toISOString();
  }
  
  if (updateData.lastAccessed instanceof Date) {
    updateData.lastAccessed = updateData.lastAccessed.toISOString();
  }
  
  // Mit Berechtigungsprüfung ausführen
  return withProjectPermission(
    id,
    true, // Erfordert Bearbeitungsrechte
    async () => {
      try {
        const projectRef = ref(database, `projects/${id}`);
        await update(projectRef, updateData);
        
        // Only show toast notification if silent is false
        if (!silent) {
          toast.success("Projekt aktualisiert");
        }
      } catch (error) {
        console.error("Error updating project:", error);
        toast.error("Fehler beim Aktualisieren des Projekts");
        throw error;
      }
    },
    "Du hast keine Berechtigung, dieses Projekt zu bearbeiten"
  );
};
