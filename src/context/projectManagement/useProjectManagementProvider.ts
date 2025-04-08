
import { useState, useEffect } from "react";
import { onValue, query, ref, limitToLast, get } from "firebase/database";
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
import { QUERY_LIMIT, database } from "@/lib/firebase";
import { ProjectMember, UserRole } from "@/types/user";
import { toast } from "sonner";

export const useProjectManagementProvider = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const { user, isAuthenticated } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  // Load all projects from Firebase
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setProjects([]);
      setCurrentProject(null);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setLoadError(null);
    
    console.log("Loading all projects for user:", user.id);
    
    try {
      // Get all projects - we'll filter in the client
      const projectsRef = query(
        ref(database, 'projects'),
        limitToLast(QUERY_LIMIT)
      );
      
      const unsubscribe = onValue(projectsRef, (snapshot) => {
        try {
          if (snapshot.exists()) {
            const projectsData = snapshot.val();
            const projectsList: Project[] = [];
            
            Object.keys(projectsData).forEach((key) => {
              const project = projectsData[key];
              
              // Check if user is owner or member
              if (project.ownerId === user.id || 
                 (project.members && project.members[user.id])) {
                projectsList.push({
                  ...project,
                  id: key,
                  createdAt: new Date(project.createdAt),
                  lastAccessed: project.lastAccessed ? new Date(project.lastAccessed) : undefined,
                });
              }
            });
            
            // Sort by most recently accessed
            projectsList.sort((a, b) => {
              const dateA = a.lastAccessed || a.createdAt;
              const dateB = b.lastAccessed || b.createdAt;
              return dateB.getTime() - dateA.getTime();
            });
            
            setProjects(projectsList);
            console.log(`Loaded ${projectsList.length} total projects`);
          } else {
            setProjects([]);
            console.log("No projects found");
          }
          setIsLoading(false);
        } catch (error) {
          console.error("Error processing projects data:", error);
          setLoadError("Failed to process projects data");
          setIsLoading(false);
        }
      }, (error) => {
        console.error("Error loading projects:", error);
        setLoadError("Failed to load projects");
        setIsLoading(false);
      });
      
      return () => unsubscribe();
    } catch (error) {
      console.error("Error setting up projects subscription:", error);
      setLoadError("Failed to load projects");
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);
  
  // Reset current project when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      setCurrentProject(null);
    }
  }, [isAuthenticated]);

  const addProject = async (project: Omit<Project, "id" | "createdAt" | "ownerId">) => {
    if (!user) return;
    
    try {
      const newProject = await addProjectToFirebase(project, user.id);
      toast.success("Project created successfully");
      // Firebase real-time updates will handle adding this to the projects list
    } catch (error) {
      console.error("Failed to add project:", error);
      toast.error("Failed to create project");
    }
  };

  const updateProject = async (id: string, projectUpdate: Partial<Project>, silent: boolean = false) => {
    try {
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
        
        if (!silent) {
          toast.success("Project updated successfully");
        }
      }
    } catch (error) {
      console.error("Failed to update project:", error);
      if (!silent) {
        toast.error("Failed to update project");
      }
    }
  };
  
  const deleteProject = async (id: string) => {
    // Check if user is the owner or has rights to delete
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
        toast.success("Project deleted successfully");
      }
    } catch (error) {
      console.error("Failed to delete project:", error);
      toast.error("Failed to delete project");
    }
  };
  
  // Get project members from the members field inside the project
  const getProjectMembers = async (projectId: string): Promise<ProjectMember[]> => {
    // Find the project
    const project = projects.find(p => p.id === projectId);
    
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
  const shareProject = async (projectId: string, email: string, role: "editor" | "viewer") => {
    try {
      await addMemberToProject(projectId, email, role);
      toast.success("Project shared successfully");
    } catch (error) {
      console.error("Error sharing project:", error);
      toast.error("Failed to share project");
      throw error;
    }
  };
  
  const shareProjectByUserId = async (projectId: string, userId: string, role: "editor" | "viewer") => {
    try {
      await addMemberToProjectByUserId(projectId, userId, role);
      toast.success("Project shared successfully");
    } catch (error) {
      console.error("Error sharing project by user ID:", error);
      toast.error("Failed to share project");
      throw error;
    }
  };
  
  const revokeAccess = async (projectId: string, userId: string) => {
    try {
      await removeMemberFromProject(projectId, userId);
      toast.success("Access revoked successfully");
    } catch (error) {
      console.error("Error revoking access:", error);
      toast.error("Failed to revoke access");
      throw error;
    }
  };
  
  const changeRole = async (projectId: string, userId: string, newRole: UserRole) => {
    try {
      await updateMemberRole(projectId, userId, newRole);
      toast.success("Role updated successfully");
    } catch (error) {
      console.error("Error changing role:", error);
      toast.error("Failed to update role");
      throw error;
    }
  };

  return {
    projects,
    currentProject,
    setCurrentProject,
    addProject,
    updateProject,
    deleteProject,
    getProjectMembers,
    shareProject,
    shareProjectByUserId,
    revokeAccess,
    changeRole,
    isLoading,
    loadError
  };
};
