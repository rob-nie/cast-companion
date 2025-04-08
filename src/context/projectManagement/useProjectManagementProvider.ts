
import { useState, useEffect } from "react";
import { onValue, query, orderByChild, equalTo, limitToLast, get, ref, startAt } from "firebase/database";
import { useUser } from "../UserContext";
import { Project } from "./types";
import { 
  addProjectToFirebase, 
  updateProjectInFirebase, 
  deleteProjectFromFirebase, 
  getProjectsRef 
} from "./projectService";
import { QUERY_LIMIT, getRecentDateThreshold, database } from "@/lib/firebase";

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
    
    setIsLoading(true);
    
    // Use the ownerId index with pagination
    const projectsRef = query(
      ref(database, 'projects'),
      orderByChild('ownerId'),
      equalTo(user.id),
      limitToLast(QUERY_LIMIT)
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
        
        // Sort by most recently accessed
        projectsList.sort((a, b) => {
          const dateA = a.lastAccessed || a.createdAt;
          const dateB = b.lastAccessed || b.createdAt;
          return dateB.getTime() - dateA.getTime();
        });
        
        setProjects(projectsList);
      } else {
        setProjects([]);
      }
      setIsLoading(false);
    });
    
    return () => unsubscribe();
  }, [isAuthenticated, user]);

  // Load shared projects - optimized to avoid large payloads
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setSharedProjects([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // First, get the project IDs the user has access to
    const membershipsRef = query(
      ref(database, 'projectMembers'),
      orderByChild('userId'),
      equalTo(user.id),
      limitToLast(QUERY_LIMIT)
    );

    // Using get() instead of onValue to reduce continuous listening overhead
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

      // Batch the fetching into smaller chunks to avoid payload size issues
      const batchSize = 5;
      const projectBatches = [];
      
      for (let i = 0; i < sharedProjectIds.length; i += batchSize) {
        projectBatches.push(sharedProjectIds.slice(i, i + batchSize));
      }
      
      // Process each batch
      const processNextBatch = async (batchIndex = 0, results: Project[] = []) => {
        if (batchIndex >= projectBatches.length) {
          // Sort by most recently accessed
          results.sort((a, b) => {
            const dateA = a.lastAccessed || a.createdAt;
            const dateB = b.lastAccessed || b.createdAt;
            return dateB.getTime() - dateA.getTime();
          });
          
          setSharedProjects(results);
          setIsLoading(false);
          return;
        }
        
        const currentBatch = projectBatches[batchIndex];
        const batchPromises = currentBatch.map(projectId => 
          get(ref(database, `projects/${projectId}`)).then(projectSnapshot => {
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
        
        const batchResults = await Promise.all(batchPromises);
        const validBatchResults = batchResults.filter((p): p is Project => p !== null);
        
        // Process next batch
        processNextBatch(batchIndex + 1, [...results, ...validBatchResults]);
      };
      
      // Start processing batches
      processNextBatch();
      
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
      
      // Also update sharedProjects if that's where the project is
      setSharedProjects((prev) =>
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
