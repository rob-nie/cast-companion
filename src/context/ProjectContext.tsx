
import { createContext, useContext, ReactNode } from "react";
import { ProjectManagementProvider, useProjectManagement, Project } from "./projectManagement";
import { ProjectMembersProvider } from "./projectMembers";

// Create the context with undefined as initial value
const ProjectContext = createContext<ReturnType<typeof useProjectManagement> | undefined>(undefined);

// Provider
export const ProjectProvider = ({ children }: { children: ReactNode }) => {
  // Wrap everything in both providers
  return (
    <ProjectManagementProvider>
      <ProjectMembersProvider>
        <ProjectContextConsumer>
          {children}
        </ProjectContextConsumer>
      </ProjectMembersProvider>
    </ProjectManagementProvider>
  );
};

// Consumer component that uses the projectManagement hooks
const ProjectContextConsumer = ({ children }: { children: ReactNode }) => {
  const projectState = useProjectManagement();
  
  return (
    <ProjectContext.Provider value={projectState}>
      {children}
    </ProjectContext.Provider>
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

// Re-export types
export type { Project };
