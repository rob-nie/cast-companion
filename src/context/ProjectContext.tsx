
import { createContext, useContext, ReactNode } from "react";
import { ProjectManagementProvider, useProjectManagement } from "./projectManagement";
import { ProjectSharingProvider, useProjectSharing } from "./projectSharing";

// Re-export types
export type { Project } from "./projectManagement";

// Combined project context
const ProjectContext = createContext<ReturnType<typeof useProjectCombined> | undefined>(undefined);

// Combined hook
const useProjectCombined = () => {
  const projectManagement = useProjectManagement();
  const projectSharing = useProjectSharing();
  
  return {
    ...projectManagement,
    ...projectSharing
  };
};

// Combined provider - ensuring proper nesting order
export const ProjectProvider = ({ children }: { children: ReactNode }) => {
  return (
    <ProjectManagementProvider>
      <ProjectSharingProvider>
        <ProjectContextProvider>{children}</ProjectContextProvider>
      </ProjectSharingProvider>
    </ProjectManagementProvider>
  );
};

// Internal provider that combines the contexts
const ProjectContextProvider = ({ children }: { children: ReactNode }) => {
  const combinedContext = useProjectCombined();
  
  return (
    <ProjectContext.Provider value={combinedContext}>
      {children}
    </ProjectContext.Provider>
  );
};

// Hook to use the combined context
export const useProjects = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error("useProjects must be used within a ProjectProvider");
  }
  return context;
};
