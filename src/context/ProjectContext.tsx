
import { createContext, useContext, ReactNode } from "react";
import { ProjectManagementProvider, useProjectManagement } from "./projectManagement";

// Re-export types
export type { Project } from "./projectManagement";

// Project context
const ProjectContext = createContext<ReturnType<typeof useProjectManagement> | undefined>(undefined);

// Provider
export const ProjectProvider = ({ children }: { children: ReactNode }) => {
  const projectState = useProjectManagement();
  
  return (
    <ProjectManagementProvider>
      <ProjectContext.Provider value={projectState}>
        {children}
      </ProjectContext.Provider>
    </ProjectManagementProvider>
  );
};

// Hook to use the context
export const useProjects = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error("useProjects must be used within a ProjectProvider");
  }
  return context;
};
