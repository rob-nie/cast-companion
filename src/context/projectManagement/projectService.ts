
import { toast } from "sonner";
import { ref, set, push, remove, update, get, query, limitToLast } from "firebase/database";
import { database, QUERY_LIMIT } from "@/lib/firebase";
import { Project } from "./types";

export const addProjectToFirebase = async (
  project: Omit<Project, "id" | "createdAt" | "ownerId">, 
  userId: string
) => {
  if (!userId) {
    toast.error("Du musst angemeldet sein, um ein Projekt zu erstellen");
    return null;
  }

  const newProjectRef = push(ref(database, 'projects'));
  const newProject = {
    ...project,
    id: newProjectRef.key!, // Firebase generated ID
    createdAt: new Date().toISOString(),
    ownerId: userId,
  };
  
  try {
    await set(newProjectRef, newProject);
    toast.success("Projekt erstellt");
    
    // Also add the creator as owner in projectMembers
    const memberRef = push(ref(database, 'projectMembers'));
    await set(memberRef, {
      userId: userId,
      projectId: newProjectRef.key,
      role: "owner"
    });
    
    return { ...newProject, createdAt: new Date(newProject.createdAt) };
  } catch (error) {
    console.error("Error adding project:", error);
    toast.error("Fehler beim Erstellen des Projekts");
    return null;
  }
};

export const updateProjectInFirebase = async (id: string, projectUpdate: Partial<Project>, silent: boolean = false) => {
  // Prepare data for Firebase
  const updateData: Record<string, any> = { ...projectUpdate };
  
  // Convert Date objects to ISO strings for Firebase
  if (updateData.createdAt instanceof Date) {
    updateData.createdAt = updateData.createdAt.toISOString();
  }
  
  if (updateData.lastAccessed instanceof Date) {
    updateData.lastAccessed = updateData.lastAccessed.toISOString();
  }
  
  const projectRef = ref(database, `projects/${id}`);
  
  try {
    await update(projectRef, updateData);
    
    // Only show toast notification if silent is false
    if (!silent) {
      toast.success("Projekt aktualisiert");
    }
    return true;
  } catch (error) {
    console.error("Error updating project:", error);
    toast.error("Fehler beim Aktualisieren des Projekts");
    return false;
  }
};

export const deleteProjectFromFirebase = async (id: string) => {
  const projectRef = ref(database, `projects/${id}`);
  
  try {
    await remove(projectRef);
    toast.success("Projekt gelöscht");
    
    // Also remove project members entries
    await cleanupProjectData(id);
    return true;
  } catch (error) {
    console.error("Error deleting project:", error);
    toast.error("Fehler beim Löschen des Projekts");
    return false;
  }
};

// Helper function to clean up related data when a project is deleted
export const cleanupProjectData = async (projectId: string) => {
  // Remove project members
  const membersRef = ref(database, 'projectMembers');
  get(membersRef).then((snapshot) => {
    if (snapshot.exists()) {
      const membersData = snapshot.val();
      Object.keys(membersData).forEach((key) => {
        if (membersData[key].projectId === projectId) {
          remove(ref(database, `projectMembers/${key}`));
        }
      });
    }
  });
  
  // Remove notes
  const notesRef = ref(database, 'notes');
  get(notesRef).then((snapshot) => {
    if (snapshot.exists()) {
      const notesData = snapshot.val();
      Object.keys(notesData).forEach((key) => {
        if (notesData[key].projectId === projectId) {
          remove(ref(database, `notes/${key}`));
        }
      });
    }
  });
  
  // Remove messages
  const messagesRef = ref(database, 'messages');
  get(messagesRef).then((snapshot) => {
    if (snapshot.exists()) {
      const messagesData = snapshot.val();
      Object.keys(messagesData).forEach((key) => {
        if (messagesData[key].projectId === projectId) {
          remove(ref(database, `messages/${key}`));
        }
      });
    }
  });
};

export const getProjectsRef = () => {
  return query(
    ref(database, 'projects'),
    limitToLast(QUERY_LIMIT)
  );
};
