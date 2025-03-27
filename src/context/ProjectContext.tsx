
import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useUser } from "./UserContext";
import { toast } from "sonner";

export type Project = {
  id: string;
  title: string;
  description: string;
  createdAt: Date;
  lastAccessed?: Date;
  ownerId: string;
};

type ProjectContextType = {
  projects: Project[];
  currentProject: Project | null;
  setCurrentProject: (project: Project) => void;
  addProject: (project: Omit<Project, "id" | "createdAt" | "ownerId">) => void;
  updateProject: (id: string, project: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  getUserProjects: () => Project[];
  getSharedProjects: () => Project[];
};

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

// Sample data
const initialProjects: Project[] = [
  {
    id: "1",
    title: "Bewerbungsgespräch - Entwickler Position",
    description: "Interview mit Kandidat für die Frontend-Entwickler Position",
    createdAt: new Date("2024-06-01"),
    lastAccessed: new Date("2024-06-10"),
    ownerId: "user-1"
  },
  {
    id: "2",
    title: "Kundenprojekt - Anforderungsanalyse",
    description: "Erstes Gespräch mit Neukunden zur Anforderungserhebung",
    createdAt: new Date("2024-06-05"),
    ownerId: "user-1"
  }
];

export const ProjectProvider = ({ children }: { children: ReactNode }) => {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const { user, isAuthenticated } = useUser();

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

    const newProject = {
      ...project,
      id: Date.now().toString(),
      createdAt: new Date(),
      ownerId: user.id,
    };
    setProjects((prev) => [...prev, newProject]);
    toast.success("Projekt erstellt");
  };

  const updateProject = (id: string, projectUpdate: Partial<Project>) => {
    setProjects((prev) =>
      prev.map((project) =>
        project.id === id ? { ...project, ...projectUpdate } : project
      )
    );
    
    // Also update currentProject if that's the one being modified
    if (currentProject?.id === id) {
      setCurrentProject(prev => prev ? { ...prev, ...projectUpdate } : null);
    }
    
    toast.success("Projekt aktualisiert");
  };

  const deleteProject = (id: string) => {
    // Check if user is the owner or has rights to delete
    const project = projects.find(p => p.id === id);
    
    if (project && project.ownerId !== user?.id) {
      toast.error("Du hast keine Berechtigung, dieses Projekt zu löschen");
      return;
    }
    
    setProjects((prev) => prev.filter((project) => project.id !== id));
    if (currentProject?.id === id) {
      setCurrentProject(null);
    }
    
    toast.success("Projekt gelöscht");
  };

  // Get projects owned by the current user
  const getUserProjects = () => {
    if (!user) return [];
    return projects.filter(project => project.ownerId === user.id);
  };

  // Get projects shared with the current user
  const getSharedProjects = () => {
    if (!user) return [];
    // In a real app, this would check against a project_members table
    // For now, we're using the mock data from UserContext
    return [];
  };

  return (
    <ProjectContext.Provider
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
    </ProjectContext.Provider>
  );
};

export const useProjects = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error("useProjects must be used within a ProjectProvider");
  }
  return context;
};
