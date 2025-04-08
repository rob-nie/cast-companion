
import { createContext, useContext, ReactNode, useCallback } from "react";
import { ProjectMember, UserRole } from "@/types/user";
import { ProjectMembersContextType } from "./types";
import {
  fetchProjectMembers,
  addMemberByEmail,
  addMemberByUserId,
  removeMemberFromProject,
  updateMemberRole,
} from "./projectMembersService";

// Create the context
const ProjectMembersContext = createContext<ProjectMembersContextType | undefined>(undefined);

// Provider component
export const ProjectMembersProvider = ({ children }: { children: ReactNode }) => {
  // Get project members
  const getProjectMembers = useCallback(async (projectId: string): Promise<ProjectMember[]> => {
    try {
      return await fetchProjectMembers(projectId);
    } catch (error) {
      console.error("Error fetching project members:", error);
      return [];
    }
  }, []);

  // Add member by email
  const addProjectMember = useCallback(async (projectId: string, email: string, role: UserRole): Promise<void> => {
    try {
      await addMemberByEmail(projectId, email, role);
    } catch (error) {
      console.error("Error adding project member:", error);
      throw error;
    }
  }, []);

  // Add member by user ID
  const addProjectMemberByUserId = useCallback(async (projectId: string, userId: string, role: UserRole): Promise<void> => {
    try {
      await addMemberByUserId(projectId, userId, role);
    } catch (error) {
      console.error("Error adding project member by user ID:", error);
      throw error;
    }
  }, []);

  // Remove member
  const removeProjectMember = useCallback(async (projectId: string, userId: string): Promise<void> => {
    try {
      await removeMemberFromProject(projectId, userId);
    } catch (error) {
      console.error("Error removing project member:", error);
      throw error;
    }
  }, []);

  // Update member role
  const updateProjectMemberRole = useCallback(async (projectId: string, userId: string, role: UserRole): Promise<void> => {
    try {
      await updateMemberRole(projectId, userId, role);
    } catch (error) {
      console.error("Error updating project member role:", error);
      throw error;
    }
  }, []);

  // The context value
  const contextValue: ProjectMembersContextType = {
    getProjectMembers,
    addProjectMember,
    addProjectMemberByUserId,
    removeProjectMember,
    updateProjectMemberRole,
  };

  return (
    <ProjectMembersContext.Provider value={contextValue}>
      {children}
    </ProjectMembersContext.Provider>
  );
};

// Hook to use the context
export const useProjectMembers = (): ProjectMembersContextType => {
  const context = useContext(ProjectMembersContext);
  
  if (!context) {
    throw new Error("useProjectMembers must be used within a ProjectMembersProvider");
  }
  
  return context;
};
