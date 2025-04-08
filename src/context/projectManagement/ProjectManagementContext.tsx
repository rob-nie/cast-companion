
import { createContext, useContext, ReactNode } from "react";
import { ProjectManagementContextType } from "./types";
import { useProjectManagementProvider } from "./useProjectManagementProvider";

const ProjectManagementContext = createContext<ProjectManagementContextType | undefined>(undefined);

export const ProjectManagementProvider = ({ children }: { children: ReactNode }) => {
  const projectState = useProjectManagementProvider();
  
  return (
    <ProjectManagementContext.Provider value={projectState}>
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
