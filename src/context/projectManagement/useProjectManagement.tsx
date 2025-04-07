import { useState, useEffect, useCallback } from "react";
import { auth } from "@/lib/firebase";
import { Project } from "./types";
import { 
  loadProjects,
  addProjectService, 
  updateProjectService, 
  deleteProjectService 
} from "./services";
import { onAuthStateChanged } from "firebase/auth";

export const useProjectManagement = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  
  // First, set up a check to ensure Firebase auth state is ready
  useEffect(() => {
    console.log("=== Setting up auth state monitor ===");
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("Auth state changed in useProjectManagement:", 
                  user ? `User: ${user.email}` : "No authenticated user");
      setAuthReady(true);
    });
    
    return () => unsubscribe();
  }, []);
  
  const handleProjectsUpdate = useCallback((loadedProjects: Project[]) => {
    console.log("=== Projects Update Handler ===");
    console.log("Received", loadedProjects.length, "projects from loader");
    
    if (loadedProjects.length > 0) {
      console.log("Projects received:", loadedProjects.map(p => ({
        id: p.id,
        title: p.title,
        ownerId: p.ownerId,
        isOwned: p.ownerId === auth.currentUser?.uid
      })));
    } else {
      console.log("No projects received");
    }
    
    setProjects(loadedProjects);
    setIsLoading(false);
    
    // If we have a current project that's no longer accessible, reset it
    if (currentProject && !loadedProjects.some(p => p.id === currentProject.id)) {
      console.log("Current project is no longer accessible, resetting");
      setCurrentProject(null);
    }
    
    console.log("Projects state updated");
  }, [currentProject]);
  
  // Load projects from Firebase when component mounts or auth changes
  useEffect(() => {
    console.log("=== Setting up projects listener ===");
    console.log("Auth ready state:", authReady);
    console.log("Firebase auth state:", auth.currentUser?.email, auth.currentUser?.uid);
    
    // Wait for both auth to be ready AND for there to be a current user before loading projects
    if (!authReady) {
      console.log("Auth state not yet confirmed, waiting before loading projects");
      return () => {};
    }
    
    if (!auth.currentUser) {
      console.log("No authenticated user, resetting projects");
      setProjects([]);
      setIsLoading(false);
      return () => {};
    }
    
    setIsLoading(true);
    
    // Set up the projects listener
    const unsubscribe = loadProjects(handleProjectsUpdate);
    
    console.log("Projects listener setup completed");
    
    return () => {
      console.log("Cleaning up projects listener");
      unsubscribe();
    };
  }, [auth.currentUser?.uid, handleProjectsUpdate, authReady]); 

  // Reset current project when user logs out
  useEffect(() => {
    console.log("=== Auth state check for project reset ===");
    console.log("Firebase auth state:", !!auth.currentUser);
    
    if (!auth.currentUser) {
      console.log("User logged out, resetting current project and projects list");
      setCurrentProject(null);
      setProjects([]);
    }
  }, [auth.currentUser]);

  // Keep the rest of the functions unchanged
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
    
    const currentUserId = auth.currentUser.uid;
    const userProjects = projects.filter(project => project.ownerId === currentUserId);
    console.log("getUserProjects: Found", userProjects.length, "projects for user", currentUserId);
    
    if (userProjects.length > 0) {
      console.log("User projects:", userProjects.map(p => ({ id: p.id, title: p.title })));
    }
    
    return userProjects;
  }, [projects]);

  // Get projects shared with the current user (not owned by them)
  const getSharedProjects = useCallback(() => {
    if (!auth.currentUser) {
      console.log("getSharedProjects: No authenticated user");
      return [];
    }
    
    const currentUserId = auth.currentUser.uid;
    const sharedProjects = projects.filter(project => project.ownerId !== currentUserId);
    
    console.log("getSharedProjects: Found", sharedProjects.length, "shared projects for user", currentUserId);
    
    if (sharedProjects.length > 0) {
      console.log("Shared projects:", sharedProjects.map(p => ({ id: p.id, title: p.title, ownerId: p.ownerId })));
    }
    
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
