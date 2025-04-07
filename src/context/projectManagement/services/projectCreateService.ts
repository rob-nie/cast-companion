
import { ref, push, set } from "firebase/database";
import { database, auth } from "@/lib/firebase";
import { Project } from "../types";

export const addProjectService = async (project: Omit<Project, "id" | "createdAt" | "ownerId">): Promise<void> => {
  if (!auth.currentUser) {
    console.error("No authenticated user");
    throw new Error("Not authenticated");
  }

  try {
    const projectsRef = ref(database, 'projects');
    const newProjectRef = push(projectsRef);
    const projectId = newProjectRef.key;

    if (!projectId) {
      throw new Error("Failed to get project ID");
    }

    console.log("Creating project with ID:", projectId);
    
    const now = new Date();
    const projectData = {
      ...project,
      ownerId: auth.currentUser.uid,
      createdAt: now.toISOString(),
      lastAccessed: now.toISOString()
    };

    await set(newProjectRef, projectData);
    console.log("Project created successfully");
  } catch (error) {
    console.error("Error creating project:", error);
    throw error;
  }
};
