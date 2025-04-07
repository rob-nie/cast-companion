
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { ProjectMember } from "@/types/user";
import { ProjectMembersContextType, UserRole } from "./types";
import { 
  fetchProjectMembers, 
  addMemberToProject,
  addMemberToProjectById,
  removeMemberFromProject, 
  updateMemberRole 
} from "./services";

const ProjectMembersContext = createContext<ProjectMembersContextType | undefined>(undefined);

export const ProjectMembersProvider = ({ children }: { children: ReactNode }) => {
  const [projectMembers, setProjectMembers] = useState<Map<string, ProjectMember[]>>(new Map());

  const setMembersForProject = (projectId: string, members: ProjectMember[]) => {
    setProjectMembers(prev => {
      const newMap = new Map(prev);
      newMap.set(projectId, members);
      return newMap;
    });
  };

  const getProjectMembers = (projectId: string): ProjectMember[] => {
    // Return cached members if we have them
    if (projectMembers.has(projectId)) {
      return projectMembers.get(projectId) || [];
    }
    
    // If not cached, trigger a fetch and return empty array for now
    fetchProjectMembers(projectId, setMembersForProject);
    return [];
  };

  const addProjectMember = async (projectId: string, email: string, role: UserRole) => {
    await addMemberToProject(projectId, email, role);
    // Refresh the members list after adding
    fetchProjectMembers(projectId, setMembersForProject);
  };

  const addProjectMemberById = async (projectId: string, userId: string, role: UserRole) => {
    await addMemberToProjectById(projectId, userId, role);
    // Refresh the members list after adding
    fetchProjectMembers(projectId, setMembersForProject);
  };

  const removeProjectMember = async (projectId: string, userId: string) => {
    await removeMemberFromProject(projectId, userId);
    // Refresh the members list after removing
    fetchProjectMembers(projectId, setMembersForProject);
  };

  const updateProjectMemberRole = async (projectId: string, userId: string, role: UserRole) => {
    await updateMemberRole(projectId, userId, role);
    // Refresh the members list after updating
    fetchProjectMembers(projectId, setMembersForProject);
  };

  return (
    <ProjectMembersContext.Provider
      value={{
        getProjectMembers,
        addProjectMember,
        addProjectMemberById,
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
