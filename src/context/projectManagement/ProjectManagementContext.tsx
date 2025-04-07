
import { createContext, useContext, ReactNode } from "react";
import { createProjectManagement } from "./useProjectManagement";
import { Project, ProjectContextType } from "./types";

// Create context
const ProjectManagementContext = createContext<ProjectContextType | undefined>(undefined);

// Export the Project type
export type { Project };

// Provider component
export const ProjectManagementProvider = ({ children }: { children: ReactNode }) => {
  const projectManagement = createProjectManagement();
  
  return (
    <ProjectManagementContext.Provider value={projectManagement}>
      {children}
    </ProjectManagementContext.Provider>
  );
};

// Hook to use the context
export const useProjectManagement = () => {
  const context = useContext(ProjectManagementContext);
  if (context === undefined) {
    throw new Error("useProjectManagement must be used within a ProjectManagementProvider");
  }
  return context;
};
