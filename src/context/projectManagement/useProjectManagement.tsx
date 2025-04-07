
import { useState, useEffect, useCallback } from "react";
import { auth } from "@/lib/firebase";
import { Project } from "./types";
import { 
  loadProjects,
  addProjectService, 
  updateProjectService, 
  deleteProjectService 
} from "./services";

// Renamed from useProjectManagement to createProjectManagement to avoid naming collision
export const createProjectManagement = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load projects from Firebase when component mounts or auth changes
  useEffect(() => {
    console.log("Setting up projects listener in createProjectManagement");
    setIsLoading(true);
    
    // Wait a brief moment to ensure auth is initialized
    const timeoutId = setTimeout(() => {
      // Only proceed if user is authenticated
      if (!auth.currentUser) {
        console.log("User not authenticated, not loading projects");
        setIsLoading(false);
        return;
      }
      
      console.log("About to load projects for user:", auth.currentUser.uid);
      const unsubscribe = loadProjects((loadedProjects) => {
        console.log("Projects loaded in createProjectManagement:", loadedProjects.length);
        setProjects(loadedProjects);
        setIsLoading(false);
        
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
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [auth.currentUser?.uid, currentProject]); 

  // Reset current project when user logs out
  useEffect(() => {
    if (!auth.currentUser) {
      console.log("User logged out, resetting current project");
      setCurrentProject(null);
      setProjects([]);
    }
  }, [auth.currentUser]);

  const addProject = useCallback(async (project: Omit<Project, "id" | "createdAt" | "ownerId">) => {
    console.log("Adding new project:", project.title);
    await addProjectService(project);
  }, []);

  const updateProject = useCallback(async (id: string, projectUpdate: Partial<Project>, silent: boolean = false) => {
    console.log("Updating project:", id);
    await updateProjectService(id, projectUpdate, silent);
  }, []);
  
  const deleteProject = useCallback(async (id: string) => {
    console.log("Deleting project:", id);
    if (!auth.currentUser) {
      console.error("No authenticated user");
      throw new Error("Not authenticated");
    }
    
    const project = projects.find(p => p.id === id);
    if (!project) {
      console.error("Project not found for deletion:", id);
      throw new Error("Project not found");
    }
    
    await deleteProjectService(id, project.ownerId);
    
    // If the deleted project is the current one, reset it
    if (currentProject && currentProject.id === id) {
      setCurrentProject(null);
    }
  }, [projects, currentProject]);

  // Get projects owned by the current user
  const getUserProjects = useCallback(() => {
    if (!auth.currentUser) {
      console.log("getUserProjects: No authenticated user");
      return [];
    }
    
    const userProjects = projects.filter(project => project.ownerId === auth.currentUser?.uid);
    console.log("getUserProjects: Found", userProjects.length, "projects for user", auth.currentUser.uid);
    return userProjects;
  }, [projects]);

  // Get projects shared with the current user (not owned by them)
  const getSharedProjects = useCallback(() => {
    if (!auth.currentUser) {
      console.log("getSharedProjects: No authenticated user");
      return [];
    }
    
    const sharedProjects = projects.filter(project => 
      project.ownerId !== auth.currentUser?.uid
    );
    
    console.log("getSharedProjects: Found", sharedProjects.length, "shared projects for user", auth.currentUser.uid);
    return sharedProjects;
  }, [projects]);

  return {
    projects,
    currentProject,
    isLoading,
    setCurrentProject,
    addProject,
    updateProject,
    deleteProject,
    getUserProjects,
    getSharedProjects
  };
};
