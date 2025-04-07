
import { ref, set, push } from "firebase/database";
import { database, auth, isUserAuthenticated } from "@/lib/firebase";
import { Project } from "../types";
import { toast } from "sonner";

/**
 * Adds a new project to Firebase
 */
export const addProjectService = async (
  project: Omit<Project, "id" | "createdAt" | "ownerId">
) => {
  if (!auth.currentUser) {
    toast.error("Du musst angemeldet sein, um ein Projekt zu erstellen");
    throw new Error("Not authenticated");
  }
  
  try {
    // Verify user is authenticated with Firebase before proceeding
    const authenticated = await isUserAuthenticated();
    if (!authenticated) {
      toast.error("Deine Anmeldung ist abgelaufen. Bitte melde dich erneut an.");
      throw new Error("Authentication expired");
    }

    const userId = auth.currentUser.uid;
    
    const newProjectRef = push(ref(database, 'projects'));
    const newProject = {
      ...project,
      createdAt: new Date().toISOString(),
      ownerId: userId,
    };
    
    await set(newProjectRef, newProject);
    toast.success("Projekt erstellt");
    
    // Also add the creator as owner in projectMembers
    try {
      const memberRef = push(ref(database, 'projectMembers'));
      await set(memberRef, {
        userId: userId,
        projectId: newProjectRef.key,
        role: "owner"
      });
    } catch (memberError) {
      console.error("Error adding project member:", memberError);
    }
  } catch (error) {
    console.error("Error adding project:", error);
    toast.error("Fehler beim Erstellen des Projekts");
    throw error;
  }
};
