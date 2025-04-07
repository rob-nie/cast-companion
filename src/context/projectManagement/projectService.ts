import { ref, set, push, remove, update, get, onValue } from "firebase/database";
import { database, auth, isUserAuthenticated } from "@/lib/firebase";
import { Project } from "./types";
import { toast } from "sonner";

export const loadProjects = (
  setProjects: (projects: Project[]) => void
) => {
  console.log("loadProjects called, auth.currentUser:", auth.currentUser?.uid);
  
  // Even if not authenticated, set up the listener
  try {
    const projectsRef = ref(database, 'projects');
    console.log("Setting up Firebase listener for projects");
    
    const unsubscribe = onValue(projectsRef, (snapshot) => {
      if (snapshot.exists()) {
        const projectsData = snapshot.val();
        const projectsList: Project[] = [];
        
        Object.keys(projectsData).forEach((key) => {
          const project = projectsData[key];
          projectsList.push({
            ...project,
            id: key,
            createdAt: new Date(project.createdAt),
            lastAccessed: project.lastAccessed ? new Date(project.lastAccessed) : undefined,
          });
        });
        
        console.log("Projects loaded from Firebase:", projectsList.length);
        setProjects(projectsList);
      } else {
        console.log("No projects found in Firebase");
        setProjects([]);
      }
    }, (error) => {
      console.error("Error loading projects from Firebase:", error);
      toast.error("Fehler beim Laden der Projekte");
    });

    return unsubscribe;
  } catch (error) {
    console.error("Failed to set up projects listener:", error);
    return () => {};
  }
};

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
};

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

// Helper function to clean up related data when a project is deleted
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
