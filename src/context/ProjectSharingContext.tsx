
import { createContext, useContext, ReactNode, useState, useCallback } from "react";
import { toast } from "sonner";
import { useProjectMembers } from "./projectMembers";
import { auth } from "@/lib/firebase";
import { Project } from "./projectManagement";

type ProjectSharingContextType = {
  shareProject: (projectId: string, email: string, role: "editor" | "viewer") => Promise<void>;
  revokeAccess: (projectId: string, userId: string) => Promise<void>;
  changeRole: (projectId: string, userId: string, newRole: "owner" | "editor" | "viewer") => Promise<void>;
};

const ProjectSharingContext = createContext<ProjectSharingContextType | undefined>(undefined);

export const ProjectSharingProvider = ({ children }: { children: ReactNode }) => {
  const { addProjectMember, removeProjectMember, updateProjectMemberRole } = useProjectMembers();

  // Share a project with another user via email
  const shareProject = async (projectId: string, email: string, role: "editor" | "viewer") => {
    try {
      await addProjectMember(projectId, email, role);
    } catch (error) {
      // Error handling is already done in addProjectMember
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
        revokeAccess,
        changeRole,
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
