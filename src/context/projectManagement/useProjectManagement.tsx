
import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { Project } from "./types";
import { 
  loadProjects,
  addProjectService, 
  updateProjectService, 
  deleteProjectService 
} from "./services"; // Updated import path

// Renamed from useProjectManagement to createProjectManagement to avoid naming collision
export const createProjectManagement = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  
  // Load projects from Firebase when component mounts
  useEffect(() => {
    console.log("Setting up projects listener in createProjectManagement");
    const unsubscribe = loadProjects((loadedProjects) => {
      console.log("Projects loaded in createProjectManagement:", loadedProjects.length);
      setProjects(loadedProjects);
      
      // If we have a current project that's no longer accessible, reset it
      if (currentProject && !loadedProjects.some(p => p.id === currentProject.id)) {
        console.log("Current project is no longer accessible, resetting");
        setCurrentProject(null);
      }
    });
    
    return () => {
      console.log("Cleaning up projects listener");
      unsubscribe();
    };
  }, [currentProject?.id]); // Add dependency on currentProject.id to detect changes

  // Reset current project when user logs out
  useEffect(() => {
    const authStateChange = () => {
      if (!auth.currentUser) {
        console.log("User logged out, resetting current project");
        setCurrentProject(null);
      }
    };
    
    // Call once immediately
    authStateChange();
    
    // Set up listener for auth state changes
    const unsubscribe = auth.onAuthStateChanged(authStateChange);
    return () => unsubscribe();
  }, []);

  const addProject = async (project: Omit<Project, "id" | "createdAt" | "ownerId">) => {
    console.log("Adding new project:", project.title);
    await addProjectService(project);
  };

  const updateProject = async (id: string, projectUpdate: Partial<Project>, silent: boolean = false) => {
    console.log("Updating project:", id);
    await updateProjectService(id, projectUpdate, silent);
  };
  
  const deleteProject = async (id: string) => {
    console.log("Deleting project:", id);
    const project = projects.find(p => p.id === id);
    if (!project) {
      console.error("Project not found for deletion:", id);
      throw new Error("Project not found");
    }
    
    await deleteProjectService(id, project.ownerId);
  };

  // Get projects owned by the current user
  const getUserProjects = () => {
    if (!auth.currentUser) {
      console.log("getUserProjects: No authenticated user");
      return [];
    }
    
    const userProjects = projects.filter(project => project.ownerId === auth.currentUser?.uid);
    console.log("getUserProjects: Found", userProjects.length, "projects for user", auth.currentUser.uid);
    return userProjects;
  };

  // Get projects shared with the current user (not owned by them)
  const getSharedProjects = () => {
    if (!auth.currentUser) {
      console.log("getSharedProjects: No authenticated user");
      return [];
    }
    
    const sharedProjects = projects.filter(project => 
      project.ownerId !== auth.currentUser?.uid
    );
    
    console.log("getSharedProjects: Found", sharedProjects.length, "shared projects for user", auth.currentUser.uid);
    return sharedProjects;
  };

  return {
    projects,
    currentProject,
    setCurrentProject,
    addProject,
    updateProject,
    deleteProject,
    getUserProjects,
    getSharedProjects
  };
};
