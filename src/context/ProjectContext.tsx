
import { createContext, useContext, ReactNode } from "react";
import { ProjectManagementProvider, useProjectManagement, Project } from "./projectManagement";
import { ProjectSharingProvider, useProjectSharing } from "./ProjectSharingContext";
import { ProjectMembersContext } from "./projectMembers";

// Re-export types
export type { Project };

// Combined project context
const ProjectContext = createContext<ReturnType<typeof useProjectCombined> | undefined>(undefined);

// Combine hooks
const useProjectCombined = () => {
  const projectManagement = useProjectManagement();
  const projectSharing = useProjectSharing();
  const projectMembers = useContext(ProjectMembersContext);
  
  if (!projectMembers) {
    throw new Error("ProjectMembersContext is undefined");
  }
  
  return {
    ...projectManagement,
    ...projectSharing,
    addProjectMemberById: projectMembers.addProjectMemberById
  };
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

// Combined provider - restructured to fix the context hierarchy
export const ProjectProvider = ({ children }: { children: ReactNode }) => {
  return (
    <ProjectManagementProvider>
      <ProjectSharingProvider>
        <ProjectContextProvider>{children}</ProjectContextProvider>
      </ProjectSharingProvider>
    </ProjectManagementProvider>
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
