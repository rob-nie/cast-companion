
import { toast } from "sonner";
import { ref, set, push, remove, update, get, query, limitToLast, orderByChild, equalTo } from "firebase/database";
import { database, QUERY_LIMIT } from "@/lib/firebase";
import { Project } from "./types";
import { UserRole } from "@/types/user";

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
    members: {
      [userId]: {
        role: "owner"
      }
    }
  };
  
  try {
    await set(newProjectRef, newProject);
    toast.success("Projekt erstellt");
    
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
    
    // Also remove any additional project data that might not be in the projects node
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
  try {
    // Remove notes with batching to avoid large operations
    const notesRef = query(
      ref(database, 'notes'),
      orderByChild('projectId'),
      equalTo(projectId),
      limitToLast(50)
    );
    
    const noteSnapshot = await get(notesRef);
    if (noteSnapshot.exists()) {
      const notesData = noteSnapshot.val();
      Object.keys(notesData).forEach(async (key) => {
        await remove(ref(database, `notes/${key}`));
      });
    }
    
    // Remove messages with batching to avoid large operations
    const messagesRef = query(
      ref(database, 'messages'),
      orderByChild('projectId'),
      equalTo(projectId),
      limitToLast(50)
    );
    
    const messageSnapshot = await get(messagesRef);
    if (messageSnapshot.exists()) {
      const messagesData = messageSnapshot.val();
      Object.keys(messagesData).forEach(async (key) => {
        await remove(ref(database, `messages/${key}`));
      });
    }
    
    // Remove project stopwatches
    await remove(ref(database, `projectStopwatches/${projectId}`));
    
  } catch (error) {
    console.error("Error cleaning up project data:", error);
    toast.error("Einige Projektdaten konnten nicht vollständig gelöscht werden");
  }
};

export const getProjectsRef = () => {
  return query(
    ref(database, 'projects'),
    limitToLast(QUERY_LIMIT)
  );
};

// Project members functions

export const addMemberToProject = async (projectId: string, email: string, role: UserRole) => {
  try {
    // Get all users and filter locally to find by email
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
    
    // Check if project exists
    const projectRef = ref(database, `projects/${projectId}`);
    const projectSnapshot = await get(projectRef);
    
    if (!projectSnapshot.exists()) {
      toast.error("Projekt nicht gefunden");
      throw new Error("Projekt nicht gefunden");
    }
    
    const projectData = projectSnapshot.val();
    
    // Check if user is already a member
    if (projectData.members && projectData.members[userId]) {
      toast.error("Benutzer ist bereits Mitglied dieses Projekts");
      throw new Error("Benutzer ist bereits Mitglied dieses Projekts");
    }
    
    // Add member to project
    await update(ref(database, `projects/${projectId}/members/${userId}`), { role });
    
    toast.success(`${userData.name} wurde zum Projekt hinzugefügt`);
  } catch (error: any) {
    console.error("Failed to add member:", error);
    if (!error.message.includes("bereits Mitglied") && !error.message.includes("nicht gefunden")) {
      toast.error("Fehler beim Hinzufügen des Mitglieds");
    }
    throw error;
  }
};

export const addMemberToProjectByUserId = async (projectId: string, userId: string, role: UserRole) => {
  try {
    // Check if user exists
    const userRef = ref(database, `users/${userId}`);
    const userSnapshot = await get(userRef);
    
    if (!userSnapshot.exists()) {
      toast.error("Benutzer nicht gefunden");
      throw new Error("Benutzer nicht gefunden");
    }
    
    const userData = userSnapshot.val();
    
    // Check if project exists
    const projectRef = ref(database, `projects/${projectId}`);
    const projectSnapshot = await get(projectRef);
    
    if (!projectSnapshot.exists()) {
      toast.error("Projekt nicht gefunden");
      throw new Error("Projekt nicht gefunden");
    }
    
    const projectData = projectSnapshot.val();
    
    // Check if user is already a member
    if (projectData.members && projectData.members[userId]) {
      toast.error("Benutzer ist bereits Mitglied dieses Projekts");
      throw new Error("Benutzer ist bereits Mitglied dieses Projekts");
    }
    
    // Add member to project
    await update(ref(database, `projects/${projectId}/members/${userId}`), { role });
    
    toast.success(`${userData.name || "Benutzer"} wurde zum Projekt hinzugefügt`);
  } catch (error: any) {
    console.error("Failed to add member by ID:", error);
    if (!error.message.includes("bereits Mitglied") && !error.message.includes("nicht gefunden")) {
      toast.error("Fehler beim Hinzufügen des Mitglieds");
    }
    throw error;
  }
};

export const removeMemberFromProject = async (projectId: string, userId: string) => {
  try {
    // Check if project exists
    const projectRef = ref(database, `projects/${projectId}`);
    const projectSnapshot = await get(projectRef);
    
    if (!projectSnapshot.exists()) {
      toast.error("Projekt nicht gefunden");
      throw new Error("Projekt nicht gefunden");
    }
    
    const projectData = projectSnapshot.val();
    
    // Check if user is a member
    if (!projectData.members || !projectData.members[userId]) {
      toast.error("Benutzer ist kein Mitglied dieses Projekts");
      throw new Error("Benutzer ist kein Mitglied dieses Projekts");
    }
    
    // Check if removing owner
    if (projectData.members[userId].role === "owner") {
      toast.error("Der Projektinhaber kann nicht entfernt werden");
      throw new Error("Der Projektinhaber kann nicht entfernt werden");
    }
    
    // Remove member from project
    await remove(ref(database, `projects/${projectId}/members/${userId}`));
    
    toast.success("Mitglied entfernt");
  } catch (error: any) {
    console.error("Failed to remove member:", error);
    if (!error.message.includes("kein Mitglied") && !error.message.includes("Projektinhaber")) {
      toast.error("Fehler beim Entfernen des Mitglieds");
    }
    throw error;
  }
};

export const updateMemberRole = async (projectId: string, userId: string, role: UserRole) => {
  try {
    // Check if project exists
    const projectRef = ref(database, `projects/${projectId}`);
    const projectSnapshot = await get(projectRef);
    
    if (!projectSnapshot.exists()) {
      toast.error("Projekt nicht gefunden");
      throw new Error("Projekt nicht gefunden");
    }
    
    const projectData = projectSnapshot.val();
    
    // Check if user is a member
    if (!projectData.members || !projectData.members[userId]) {
      toast.error("Benutzer ist kein Mitglied dieses Projekts");
      throw new Error("Benutzer ist kein Mitglied dieses Projekts");
    }
    
    // Update role
    await update(ref(database, `projects/${projectId}/members/${userId}`), { role });
    
    toast.success("Rolle aktualisiert");
  } catch (error) {
    toast.error("Fehler beim Aktualisieren der Rolle");
    throw error;
  }
};
