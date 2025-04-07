
import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { Project } from "./types";
import { 
  loadProjects,
  addProjectService, 
  updateProjectService, 
  deleteProjectService 
} from "./projectService";

export const useProjectManagement = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  
  // Load projects from Firebase when user is authenticated
  useEffect(() => {
    const unsubscribe = loadProjects(setProjects);
    return () => unsubscribe();
  }, []);

  // Reset current project when user logs out
  useEffect(() => {
    if (!auth.currentUser) {
      setCurrentProject(null);
    }
  }, [auth.currentUser]);

  const addProject = async (project: Omit<Project, "id" | "createdAt" | "ownerId">) => {
    await addProjectService(project);
  };

  const updateProject = async (id: string, projectUpdate: Partial<Project>, silent: boolean = false) => {
    await updateProjectService(id, projectUpdate, silent);
  };
  
  const deleteProject = async (id: string) => {
    const project = projects.find(p => p.id === id);
    if (!project) {
      throw new Error("Project not found");
    }
    
    await deleteProjectService(id, project.ownerId);
  };

  // Get projects owned by the current user
  const getUserProjects = () => {
    if (!auth.currentUser) return [];
    return projects.filter(project => project.ownerId === auth.currentUser?.uid);
  };

  // Get projects shared with the current user
  const getSharedProjects = () => {
    if (!auth.currentUser) return [];
    return projects.filter(project => 
      project.ownerId !== auth.currentUser?.uid
    );
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
