import { useState, useEffect } from "react";
import { onValue, query, orderByChild, equalTo, limitToLast, get, ref, startAt } from "firebase/database";
import { useUser } from "../UserContext";
import { Project } from "./types";
import { 
  addProjectToFirebase, 
  updateProjectInFirebase, 
  deleteProjectFromFirebase, 
  getProjectsRef,
  addMemberToProject,
  addMemberToProjectByUserId,
  removeMemberFromProject,
  updateMemberRole 
} from "./projectService";
import { QUERY_LIMIT, getRecentDateThreshold, database } from "@/lib/firebase";
import { ProjectMember, UserRole } from "@/types/user";

export const useProjectManagementProvider = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const { user, isAuthenticated } = useUser();
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

  // Load shared projects - now using the members structure inside projects
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setSharedProjects([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Find all projects where current user is in members but not the owner
    // We need to cycle through projects and check locally since Firebase doesn't support complex queries
    const projectsRef = ref(database, 'projects');
    
    const unsubscribe = onValue(projectsRef, (snapshot) => {
      if (!snapshot.exists()) {
        setSharedProjects([]);
        setIsLoading(false);
        return;
      }
      
      const projectsData = snapshot.val();
      const sharedProjectsList: Project[] = [];
      
      Object.keys(projectsData).forEach(key => {
        const project = projectsData[key];
        
        // Check if the project has members and the current user is a member
        // but not the owner of the project
        if (
          project.members && 
          project.members[user.id] && 
          project.ownerId !== user.id
        ) {
          sharedProjectsList.push({
            ...project,
            id: key,
            createdAt: new Date(project.createdAt),
            lastAccessed: project.lastAccessed ? new Date(project.lastAccessed) : undefined,
          });
        }
      });
      
      // Sort by most recently accessed
      sharedProjectsList.sort((a, b) => {
        const dateA = a.lastAccessed || a.createdAt;
        const dateB = b.lastAccessed || b.createdAt;
        return dateB.getTime() - dateA.getTime();
      });
      
      setSharedProjects(sharedProjectsList);
      setIsLoading(false);
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
  
  // Get project members - Fixed the TypeScript error by using Promise.all to resolve all promises
  const getProjectMembers = async (projectId: string): Promise<ProjectMember[]> => {
    // Find the project
    const project = [...projects, ...sharedProjects].find(p => p.id === projectId);
    
    if (!project || !project.members) {
      return [];
    }
    
    // Convert members object to array of promises and resolve them
    const memberPromises = Object.entries(project.members).map(async ([userId, memberData]) => {
      // Try to get user details from the users collection
      let name = "Unknown User";
      let email = "";
      let avatar = undefined;
      
      try {
        const userRef = ref(database, `users/${userId}`);
        const userSnapshot = await get(userRef);
        
        if (userSnapshot.exists()) {
          const userData = userSnapshot.val();
          name = userData.name || name;
          email = userData.email || email;
          avatar = userData.avatar;
        }
      } catch (error) {
        console.error("Error fetching user details:", error);
      }
      
      return {
        userId,
        projectId,
        role: memberData.role,
        name,
        email,
        avatar
      };
    });
    
    // Resolve all promises to get the actual members array
    return Promise.all(memberPromises);
  };
  
  // Project sharing functions
  const shareProject = (projectId: string, email: string, role: "editor" | "viewer") => {
    return addMemberToProject(projectId, email, role);
  };
  
  const shareProjectByUserId = (projectId: string, userId: string, role: "editor" | "viewer") => {
    return addMemberToProjectByUserId(projectId, userId, role);
  };
  
  const revokeAccess = (projectId: string, userId: string) => {
    return removeMemberFromProject(projectId, userId);
  };
  
  const changeRole = (projectId: string, userId: string, newRole: UserRole) => {
    return updateMemberRole(projectId, userId, newRole);
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
    getProjectMembers,
    shareProject,
    shareProjectByUserId,
    revokeAccess,
    changeRole,
    isLoading
  };
};
