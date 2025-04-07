
import { ref, push, set } from "firebase/database";
import { database, auth } from "@/lib/firebase";
import { Project } from "../types";

export const addProjectService = async (project: Omit<Project, "id" | "createdAt" | "ownerId">): Promise<void> => {
  console.log("==== addProjectService Called ====");
  
  if (!auth.currentUser) {
    console.error("No authenticated user");
    throw new Error("Not authenticated");
  }

  try {
    console.log("Creating new project with title:", project.title);
    console.log("Current user:", auth.currentUser.email, auth.currentUser.uid);
    
    const projectsRef = ref(database, 'projects');
    console.log("Projects ref path:", projectsRef.toString());
    
    const newProjectRef = push(projectsRef);
    const projectId = newProjectRef.key;

    if (!projectId) {
      console.error("Failed to get project ID from Firebase");
      throw new Error("Failed to get project ID");
    }

    console.log("Generated project ID:", projectId);
    
    const now = new Date();
    const projectData = {
      ...project,
      ownerId: auth.currentUser.uid,
      createdAt: now.toISOString(),
      lastAccessed: now.toISOString()
    };

    console.log("Full project data to save:", projectData);

    await set(newProjectRef, projectData);
    console.log("Project created successfully with ID:", projectId);
  } catch (error) {
    console.error("Error creating project:", error);
    console.log("Error details:", JSON.stringify(error));
    throw error;
  }
};
