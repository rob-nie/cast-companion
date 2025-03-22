
import { createContext, useContext, useState, ReactNode } from "react";

export type Project = {
  id: string;
  title: string;
  description: string;
  createdAt: Date;
  lastAccessed?: Date;
};

type ProjectContextType = {
  projects: Project[];
  currentProject: Project | null;
  setCurrentProject: (project: Project) => void;
  addProject: (project: Omit<Project, "id" | "createdAt">) => void;
  updateProject: (id: string, project: Partial<Project>) => void;
  deleteProject: (id: string) => void;
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
  },
  {
    id: "2",
    title: "Kundenprojekt - Anforderungsanalyse",
    description: "Erstes Gespräch mit Neukunden zur Anforderungserhebung",
    createdAt: new Date("2024-06-05"),
  }
];

export const ProjectProvider = ({ children }: { children: ReactNode }) => {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);

  const addProject = (project: Omit<Project, "id" | "createdAt">) => {
    const newProject = {
      ...project,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    setProjects((prev) => [...prev, newProject]);
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
  };

  const deleteProject = (id: string) => {
    setProjects((prev) => prev.filter((project) => project.id !== id));
    if (currentProject?.id === id) {
      setCurrentProject(null);
    }
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
