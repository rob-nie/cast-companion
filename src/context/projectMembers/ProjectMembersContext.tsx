
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { ProjectMember } from "@/types/user";
import { ProjectMembersContextType, UserRole } from "./types";
import { 
  fetchProjectMembers, 
  addMemberToProject, 
  removeMemberFromProject, 
  updateMemberRole 
} from "./services";

const ProjectMembersContext = createContext<ProjectMembersContextType | undefined>(undefined);

export const ProjectMembersProvider = ({ children }: { children: ReactNode }) => {
  const [projectMembers, setProjectMembers] = useState<Map<string, ProjectMember[]>>(new Map());

  const setMembersForProject = (projectId: string, members: ProjectMember[]) => {
    setProjectMembers(prev => new Map(prev).set(projectId, members));
  };

  const getProjectMembers = (projectId: string): ProjectMember[] => {
    // Return cached members if we have them
    if (projectMembers.has(projectId)) {
      return projectMembers.get(projectId) || [];
    }
    
    // If not cached, return empty array and start fetching
    fetchProjectMembers(projectId, setMembersForProject);
    return [];
  };

  const addProjectMember = async (projectId: string, email: string, role: UserRole) => {
    await addMemberToProject(projectId, email, role);
  };

  const removeProjectMember = async (projectId: string, userId: string) => {
    await removeMemberFromProject(projectId, userId);
  };

  const updateProjectMemberRole = async (projectId: string, userId: string, role: UserRole) => {
    await updateMemberRole(projectId, userId, role);
  };

  return (
    <ProjectMembersContext.Provider
      value={{
        getProjectMembers,
        addProjectMember,
        removeProjectMember,
        updateProjectMemberRole
      }}
    >
      {children}
    </ProjectMembersContext.Provider>
  );
};

export const useProjectMembers = () => {
  const context = useContext(ProjectMembersContext);
  if (context === undefined) {
    throw new Error("useProjectMembers must be used within a ProjectMembersProvider");
  }
  return context;
};
