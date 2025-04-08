
import { useState, useEffect } from "react";
import { onValue, query, orderByChild, equalTo, limitToLast } from "firebase/database";
import { useUser } from "../UserContext";
import { Project } from "./types";
import { 
  addProjectToFirebase, 
  updateProjectInFirebase, 
  deleteProjectFromFirebase, 
  getProjectsRef 
} from "./projectService";
import { QUERY_LIMIT, database } from "@/lib/firebase";
import { ref } from "firebase/database";

export const useProjectManagementProvider = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const { user, isAuthenticated, getProjectMembers } = useUser();
  
  // Load projects from Firebase when user is authenticated
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setProjects([]);
      setCurrentProject(null);
      return;
    }
    
    // Use the new ownerId index to efficiently query projects owned by the user
    const projectsRef = query(
      ref(database, 'projects'),
      orderByChild('ownerId'),
      equalTo(user.id),
      limitToLast(Math.min(QUERY_LIMIT, 10)) // Further limit to avoid payload issues
    );
    
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
        
        setProjects(projectsList);
      } else {
        setProjects([]);
      }
    });
    
    return () => unsubscribe();
  }, [isAuthenticated, user]);
  
  // Reset current project when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      setCurrentProject(null);
    }
  }, [isAuthenticated]);

  const addProject = async (project: Omit<Project, "id" | "createdAt" | "ownerId">) => {
    if (!user) return;
    
    const newProject = await addProjectToFirebase(project, user.id);
    // Firebase real-time updates will handle adding this to the projects list
  };

  const updateProject = async (id: string, projectUpdate: Partial<Project>, silent: boolean = false) => {
    const success = await updateProjectInFirebase(id, projectUpdate, silent);
    
    if (success) {
      // Update local state
      setProjects((prev) =>
        prev.map((project) =>
          project.id === id ? { ...project, ...projectUpdate } : project
        )
      );
      
      // Also update currentProject if that's the one being modified
      if (currentProject?.id === id) {
        setCurrentProject(prev => prev ? { ...prev, ...projectUpdate } : null);
      }
    }
  };
  
  const deleteProject = async (id: string) => {
    // Check if user is the owner or has rights to delete
    const project = projects.find(p => p.id === id);
    
    if (project && project.ownerId !== user?.id) {
      return;
    }
    
    const success = await deleteProjectFromFirebase(id);
    
    if (success) {
      // Update local state
      setProjects((prev) => prev.filter((project) => project.id !== id));
      if (currentProject?.id === id) {
        setCurrentProject(null);
      }
    }
  };

  // Get projects owned by the current user
  const getUserProjects = () => {
    if (!user) return [];
    return projects.filter(project => project.ownerId === user.id);
  };

  // Get projects shared with the current user
  const getSharedProjects = () => {
    if (!user) return [];
    
    // Get projects not owned by the user
    const notOwnedProjects = projects.filter(project => project.ownerId !== user.id);
    
    // Check which projects have the user as a member
    return notOwnedProjects.filter(project => {
      const members = getProjectMembers(project.id);
      return members.some(member => member.userId === user.id);
    });
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
