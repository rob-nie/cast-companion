
import { useState, useEffect, useCallback } from "react";
import { useUser } from "../UserContext";
import { Project } from "./types";
import { 
  fetchProjects,
  addProjectToFirebase, 
  updateProjectInFirebase, 
  deleteProjectFromFirebase
} from "./projectService";
import { toast } from "sonner";

export const useProjectManagementProvider = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const { user, isAuthenticated } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  // Load projects when user is authenticated
  useEffect(() => {
    let unsubscribe: () => void = () => {};
    
    if (!isAuthenticated || !user) {
      setProjects([]);
      setCurrentProject(null);
      setIsLoading(false);
      return () => {};
    }
    
    setIsLoading(true);
    setLoadError(null);
    
    try {
      console.log("Loading projects for user:", user.id);
      
      // Callback from service for project updates
      const handleProjectsUpdate = (loadedProjects: Project[]) => {
        setProjects(loadedProjects);
        setIsLoading(false);
        console.log(`${loadedProjects.length} projects loaded`);
      };
      
      // Subscribe to project updates
      unsubscribe = fetchProjects(user.id, handleProjectsUpdate);
    } catch (error) {
      console.error("Error setting up project subscription:", error);
      setLoadError("Projects could not be loaded");
      setIsLoading(false);
    }
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isAuthenticated, user]);
  
  // Reset current project when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      setCurrentProject(null);
    }
  }, [isAuthenticated]);

  // Add project
  const addProject = useCallback(async (project: Omit<Project, "id" | "createdAt" | "ownerId">) => {
    if (!user) return;
    
    try {
      await addProjectToFirebase(project, user.id);
      // Real-time updates will add the project to the list
    } catch (error) {
      console.error("Error adding project:", error);
    }
  }, [user]);

  // Update project
  const updateProject = useCallback(async (id: string, projectUpdate: Partial<Project>, silent: boolean = false) => {
    try {
      const success = await updateProjectInFirebase(id, projectUpdate, silent);
      
      if (success) {
        // Update local state
        setProjects((prev) =>
          prev.map((project) =>
            project.id === id ? { ...project, ...projectUpdate } : project
          )
        );
        
        // Also update current project if it's the same
        if (currentProject?.id === id) {
          setCurrentProject(prev => prev ? { ...prev, ...projectUpdate } : null);
        }
      }
    } catch (error) {
      console.error("Error updating project:", error);
    }
  }, [currentProject?.id]);
  
  // Delete project
  const deleteProject = useCallback(async (id: string) => {
    // Check if user is owner
    const project = projects.find(p => p.id === id);
    
    if (project && project.ownerId !== user?.id) {
      toast.error("You don't have permission to delete this project");
      return;
    }
    
    try {
      const success = await deleteProjectFromFirebase(id);
      
      if (success) {
        // Update local state
        setProjects((prev) => prev.filter((project) => project.id !== id));
        if (currentProject?.id === id) {
          setCurrentProject(null);
        }
      }
    } catch (error) {
      console.error("Error deleting project:", error);
    }
  }, [projects, currentProject?.id, user?.id]);

  return {
    projects,
    currentProject,
    setCurrentProject,
    addProject,
    updateProject,
    deleteProject,
    isLoading,
    loadError
  };
};
