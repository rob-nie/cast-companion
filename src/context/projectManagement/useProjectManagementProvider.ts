
import { useState, useEffect } from "react";
import { onValue, query, orderByChild, equalTo, limitToLast, get, ref } from "firebase/database";
import { useUser } from "../UserContext";
import { Project } from "./types";
import { 
  addProjectToFirebase, 
  updateProjectInFirebase, 
  deleteProjectFromFirebase, 
  getProjectsRef 
} from "./projectService";
import { QUERY_LIMIT, database } from "@/lib/firebase";

export const useProjectManagementProvider = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const { user, isAuthenticated, getProjectMembers } = useUser();
  const [sharedProjects, setSharedProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load projects owned by the user from Firebase when user is authenticated
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setProjects([]);
      setCurrentProject(null);
      setIsLoading(false);
      return;
    }
    
    // Use the ownerId index with a smaller limit
    const projectsRef = query(
      ref(database, 'projects'),
      orderByChild('ownerId'),
      equalTo(user.id),
      limitToLast(5) // Reduced limit to avoid payload size issues
    );
    
    const unsubscribe = onValue(projectsRef, (snapshot) => {
      setIsLoading(true);
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
      setIsLoading(false);
    });
    
    return () => unsubscribe();
  }, [isAuthenticated, user]);

  // Load shared projects - using a different approach to avoid large payloads
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setSharedProjects([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Get project memberships for the current user with a smaller limit
    const membershipsRef = query(
      ref(database, 'projectMembers'),
      orderByChild('userId'),
      equalTo(user.id),
      limitToLast(10)
    );

    // Using once() instead of onValue to reduce continuous listening overhead
    get(membershipsRef).then((snapshot) => {
      if (!snapshot.exists()) {
        setSharedProjects([]);
        setIsLoading(false);
        return;
      }

      const memberships = snapshot.val();
      const sharedProjectIds = Object.values(memberships)
        .filter((member: any) => member.userId === user.id && member.role !== "owner")
        .map((member: any) => member.projectId);

      if (sharedProjectIds.length === 0) {
        setSharedProjects([]);
        setIsLoading(false);
        return;
      }

      // Fetch projects one by one to avoid large payloads
      const sharedProjectPromises = sharedProjectIds.map((projectId) => 
        get(ref(database, `projects/${projectId}`)).then((projectSnapshot) => {
          if (!projectSnapshot.exists()) return null;
          
          const projectData = projectSnapshot.val();
          return {
            ...projectData,
            id: projectId,
            createdAt: new Date(projectData.createdAt),
            lastAccessed: projectData.lastAccessed ? new Date(projectData.lastAccessed) : undefined,
          };
        })
      );
      
      // Wait for all promises to resolve
      Promise.all(sharedProjectPromises).then((results) => {
        const validResults = results.filter((project): project is Project => project !== null);
        setSharedProjects(validResults);
        setIsLoading(false);
      }).catch(err => {
        console.error("Error fetching shared projects:", err);
        setIsLoading(false);
      });
    }).catch(err => {
      console.error("Error fetching project memberships:", err);
      setIsLoading(false);
    });

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
    return projects;
  };

  // Get projects shared with the current user
  const getSharedProjects = () => {
    if (!user) return [];
    return sharedProjects;
  };

  return {
    projects: [...projects, ...sharedProjects],
    currentProject,
    setCurrentProject,
    addProject,
    updateProject,
    deleteProject,
    getUserProjects,
    getSharedProjects,
    isLoading
  };
};
