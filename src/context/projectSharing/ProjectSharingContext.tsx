
import { createContext, useContext, ReactNode } from "react";
import { useProjectMembers } from "../projectMembers";
import { useProjectManagement } from "../projectManagement";
import { ProjectSharingContextType } from "./types";

const ProjectSharingContext = createContext<ProjectSharingContextType | undefined>(undefined);

export const ProjectSharingProvider = ({ children }: { children: ReactNode }) => {
  const { addProjectMember, addProjectMemberByUserId, removeProjectMember, updateProjectMemberRole } = useProjectMembers();
  const { projects, currentProject } = useProjectManagement();

  // Share a project with another user using email
  const shareProject = async (projectId: string, email: string, role: "editor" | "viewer") => {
    try {
      await addProjectMember(projectId, email, role);
    } catch (error) {
      // Error handling is already done in addProjectMember
      throw error;
    }
  };

  // Share a project with another user using userId
  const shareProjectByUserId = async (projectId: string, userId: string, role: "editor" | "viewer") => {
    try {
      await addProjectMemberByUserId(projectId, userId, role);
    } catch (error) {
      // Error handling is already done in addProjectMemberByUserId
      throw error;
    }
  };

  // Revoke access to a project
  const revokeAccess = async (projectId: string, userId: string) => {
    try {
      await removeProjectMember(projectId, userId);
    } catch (error) {
      // Error handling is already done in removeProjectMember
      throw error;
    }
  };

  // Change a user's role in a project
  const changeRole = async (projectId: string, userId: string, newRole: "owner" | "editor" | "viewer") => {
    try {
      await updateProjectMemberRole(projectId, userId, newRole);
    } catch (error) {
      // Error handling is already done in updateProjectMemberRole
      throw error;
    }
  };

  return (
    <ProjectSharingContext.Provider
      value={{
        shareProject,
        shareProjectByUserId,
        revokeAccess,
        changeRole
      }}
    >
      {children}
    </ProjectSharingContext.Provider>
  );
};

export const useProjectSharing = () => {
  const context = useContext(ProjectSharingContext);
  if (context === undefined) {
    throw new Error("useProjectSharing must be used within a ProjectSharingProvider");
  }
  return context;
};
