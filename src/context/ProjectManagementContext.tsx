
import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useUser } from "./UserContext";
import { toast } from "sonner";
import { ref, set, push, remove, update, onValue, get, query, orderByChild, limitToLast } from "firebase/database";
import { database, QUERY_LIMIT } from "@/lib/firebase";

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
  addProject: (project: Omit<Project, "id" | "createdAt" | "ownerId">) => void;
  updateProject: (id: string, project: Partial<Project>, silent?: boolean) => void;
  deleteProject: (id: string) => void;
  getUserProjects: () => Project[];
  getSharedProjects: () => Project[];
};

const ProjectManagementContext = createContext<ProjectManagementContextType | undefined>(undefined);

export const ProjectManagementProvider = ({ children }: { children: ReactNode }) => {
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
    
    // Optimierte Projektabfrage mit Limit
    const projectsRef = query(
      ref(database, 'projects'),
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

  const addProject = (project: Omit<Project, "id" | "createdAt" | "ownerId">) => {
    if (!user) {
      toast.error("Du musst angemeldet sein, um ein Projekt zu erstellen");
      return;
    }

    const newProjectRef = push(ref(database, 'projects'));
    const newProject = {
      ...project,
      id: newProjectRef.key!, // Firebase generated ID
      createdAt: new Date().toISOString(),
      ownerId: user.id,
    };
    
    set(newProjectRef, newProject)
      .then(() => {
        toast.success("Projekt erstellt");
        
        // Also add the creator as owner in projectMembers
        const memberRef = push(ref(database, 'projectMembers'));
        set(memberRef, {
          userId: user.id,
          projectId: newProjectRef.key,
          role: "owner"
        });
      })
      .catch((error) => {
        console.error("Error adding project:", error);
        toast.error("Fehler beim Erstellen des Projekts");
      });
  };

  const updateProject = (id: string, projectUpdate: Partial<Project>, silent: boolean = false) => {
    // Prepare data for Firebase
    const updateData: Record<string, any> = { ...projectUpdate };
    
    // Convert Date objects to ISO strings for Firebase
    if (updateData.createdAt instanceof Date) {
      updateData.createdAt = updateData.createdAt.toISOString();
    }
    
    if (updateData.lastAccessed instanceof Date) {
      updateData.lastAccessed = updateData.lastAccessed.toISOString();
    }
    
    const projectRef = ref(database, `projects/${id}`);
    update(projectRef, updateData)
      .then(() => {
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
        
        // Only show toast notification if silent is false
        if (!silent) {
          toast.success("Projekt aktualisiert");
        }
      })
      .catch((error) => {
        console.error("Error updating project:", error);
        toast.error("Fehler beim Aktualisieren des Projekts");
      });
  };
  
  const deleteProject = (id: string) => {
    // Check if user is the owner or has rights to delete
    const project = projects.find(p => p.id === id);
    
    if (project && project.ownerId !== user?.id) {
      toast.error("Du hast keine Berechtigung, dieses Projekt zu löschen");
      return;
    }
    
    const projectRef = ref(database, `projects/${id}`);
    remove(projectRef)
      .then(() => {
        // Update local state
        setProjects((prev) => prev.filter((project) => project.id !== id));
        if (currentProject?.id === id) {
          setCurrentProject(null);
        }
        
        toast.success("Projekt gelöscht");
        
        // Also remove project members entries
        cleanupProjectData(id);
      })
      .catch((error) => {
        console.error("Error deleting project:", error);
        toast.error("Fehler beim Löschen des Projekts");
      });
  };
  
  // Helper function to clean up related data when a project is deleted
  const cleanupProjectData = (projectId: string) => {
    // Remove project members
    const membersRef = ref(database, 'projectMembers');
    get(membersRef).then((snapshot) => {
      if (snapshot.exists()) {
        const membersData = snapshot.val();
        Object.keys(membersData).forEach((key) => {
          if (membersData[key].projectId === projectId) {
            remove(ref(database, `projectMembers/${key}`));
          }
        });
      }
    });
    
    // Remove notes
    const notesRef = ref(database, 'notes');
    get(notesRef).then((snapshot) => {
      if (snapshot.exists()) {
        const notesData = snapshot.val();
        Object.keys(notesData).forEach((key) => {
          if (notesData[key].projectId === projectId) {
            remove(ref(database, `notes/${key}`));
          }
        });
      }
    });
    
    // Remove messages
    const messagesRef = ref(database, 'messages');
    get(messagesRef).then((snapshot) => {
      if (snapshot.exists()) {
        const messagesData = snapshot.val();
        Object.keys(messagesData).forEach((key) => {
          if (messagesData[key].projectId === projectId) {
            remove(ref(database, `messages/${key}`));
          }
        });
      }
    });
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
