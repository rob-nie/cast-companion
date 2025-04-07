
import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { toast } from "sonner";
import { ref, set, push, remove, update, onValue, get } from "firebase/database";
import { database, auth, isUserAuthenticated } from "@/lib/firebase";

export type Project = {
  id: string;
  title: string;
  description: string;
  createdAt: Date;
  lastAccessed?: Date;
  ownerId: string;
};

type ProjectManagementContextType = {
  projects: Project[];
  currentProject: Project | null;
  setCurrentProject: (project: Project) => void;
  addProject: (project: Omit<Project, "id" | "createdAt" | "ownerId">) => Promise<void>;
  updateProject: (id: string, project: Partial<Project>, silent?: boolean) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  getUserProjects: () => Project[];
  getSharedProjects: () => Project[];
};

const ProjectManagementContext = createContext<ProjectManagementContextType | undefined>(undefined);

export const ProjectManagementProvider = ({ children }: { children: ReactNode }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const { user, isAuthenticated } = useAuth();
  
  // Load projects from Firebase when user is authenticated
  useEffect(() => {
    let unsubscribe = () => {};
    
    const loadProjects = async () => {
      if (!isAuthenticated || !user) {
        setProjects([]);
        setCurrentProject(null);
        return;
      }
      
      console.log("Loading projects for user:", user.id);
      
      try {
        const projectsRef = ref(database, 'projects');
        unsubscribe = onValue(projectsRef, (snapshot) => {
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
            console.log("Projects loaded:", projectsList.length);
          } else {
            console.log("No projects found");
            setProjects([]);
          }
        }, (error) => {
          console.error("Error loading projects:", error);
          toast.error("Fehler beim Laden der Projekte");
        });
      } catch (error) {
        console.error("Failed to set up projects listener:", error);
      }
    };
    
    loadProjects();
    
    return () => unsubscribe();
  }, [isAuthenticated, user]);
  
  // Reset current project when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      setCurrentProject(null);
    }
  }, [isAuthenticated]);

  const addProject = async (project: Omit<Project, "id" | "createdAt" | "ownerId">) => {
    if (!auth.currentUser) {
      toast.error("Du musst angemeldet sein, um ein Projekt zu erstellen");
      throw new Error("Not authenticated");
    }
    
    try {
      // Verify user is authenticated with Firebase before proceeding
      const authenticated = await isUserAuthenticated();
      if (!authenticated) {
        toast.error("Deine Anmeldung ist abgelaufen. Bitte melde dich erneut an.");
        throw new Error("Authentication expired");
      }

      const userId = auth.currentUser.uid;
      
      const newProjectRef = push(ref(database, 'projects'));
      const newProject = {
        ...project,
        createdAt: new Date().toISOString(),
        ownerId: userId,
      };
      
      await set(newProjectRef, newProject);
      toast.success("Projekt erstellt");
      
      // Also add the creator as owner in projectMembers
      try {
        const memberRef = push(ref(database, 'projectMembers'));
        await set(memberRef, {
          userId: userId,
          projectId: newProjectRef.key,
          role: "owner"
        });
      } catch (memberError) {
        console.error("Error adding project member:", memberError);
      }
      
      return;
    } catch (error) {
      console.error("Error adding project:", error);
      toast.error("Fehler beim Erstellen des Projekts");
      throw error;
    }
  };

  const updateProject = async (id: string, projectUpdate: Partial<Project>, silent: boolean = false) => {
    if (!auth.currentUser) {
      toast.error("Du musst angemeldet sein, um ein Projekt zu aktualisieren");
      throw new Error("Not authenticated");
    }
    
    // Prepare data for Firebase
    const updateData: Record<string, any> = { ...projectUpdate };
    
    // Convert Date objects to ISO strings for Firebase
    if (updateData.createdAt instanceof Date) {
      updateData.createdAt = updateData.createdAt.toISOString();
    }
    
    if (updateData.lastAccessed instanceof Date) {
      updateData.lastAccessed = updateData.lastAccessed.toISOString();
    }
    
    try {
      const projectRef = ref(database, `projects/${id}`);
      await update(projectRef, updateData);
      
      // Only show toast notification if silent is false
      if (!silent) {
        toast.success("Projekt aktualisiert");
      }
      
      return;
    } catch (error) {
      console.error("Error updating project:", error);
      toast.error("Fehler beim Aktualisieren des Projekts");
      throw error;
    }
  };
  
  const deleteProject = async (id: string) => {
    if (!auth.currentUser) {
      toast.error("Du musst angemeldet sein, um ein Projekt zu löschen");
      throw new Error("Not authenticated");
    }
    
    // Check if user is the owner or has rights to delete
    const project = projects.find(p => p.id === id);
    
    if (project && project.ownerId !== auth.currentUser.uid) {
      toast.error("Du hast keine Berechtigung, dieses Projekt zu löschen");
      throw new Error("Permission denied");
    }
    
    try {
      const projectRef = ref(database, `projects/${id}`);
      await remove(projectRef);
      
      toast.success("Projekt gelöscht");
      
      // Also remove project members entries
      await cleanupProjectData(id);
      
      return;
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error("Fehler beim Löschen des Projekts");
      throw error;
    }
  };
  
  // Helper function to clean up related data when a project is deleted
  const cleanupProjectData = async (projectId: string) => {
    try {
      // Remove project members
      const membersRef = ref(database, 'projectMembers');
      const membersSnapshot = await get(membersRef);
      if (membersSnapshot.exists()) {
        const membersData = membersSnapshot.val();
        Object.keys(membersData).forEach(async (key) => {
          if (membersData[key].projectId === projectId) {
            await remove(ref(database, `projectMembers/${key}`));
          }
        });
      }
      
      // Remove notes
      const notesRef = ref(database, 'notes');
      const notesSnapshot = await get(notesRef);
      if (notesSnapshot.exists()) {
        const notesData = notesSnapshot.val();
        Object.keys(notesData).forEach(async (key) => {
          if (notesData[key].projectId === projectId) {
            await remove(ref(database, `notes/${key}`));
          }
        });
      }
    } catch (error) {
      console.error("Error cleaning up project data:", error);
    }
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

  return (
    <ProjectManagementContext.Provider
      value={{
        projects,
        currentProject,
        setCurrentProject,
        addProject,
        updateProject,
        deleteProject,
        getUserProjects,
        getSharedProjects
      }}
    >
      {children}
    </ProjectManagementContext.Provider>
  );
};

export const useProjectManagement = () => {
  const context = useContext(ProjectManagementContext);
  if (context === undefined) {
    throw new Error("useProjectManagement must be used within a ProjectManagementProvider");
  }
  return context;
};
