
import { createContext, useContext, ReactNode } from "react";
import { useProjectMembers } from "../projectMembers";
import { ProjectSharingContextType } from "./types";
import { toast } from "sonner";
import { UserRole } from "@/types/user";

const ProjectSharingContext = createContext<ProjectSharingContextType | undefined>(undefined);

/**
 * Provider für die Projekt-Freigabe-Funktionalität
 */
export const ProjectSharingProvider = ({ children }: { children: ReactNode }) => {
  const { 
    addProjectMember, 
    addProjectMemberByUserId, 
    removeProjectMember, 
    updateProjectMemberRole 
  } = useProjectMembers();

  /**
   * Projekt mit einem anderen Benutzer teilen (per E-Mail)
   */
  const shareProject = async (projectId: string, email: string, role: "editor" | "viewer") => {
    try {
      if (!email.trim()) {
        toast.error("Bitte geben Sie eine E-Mail-Adresse ein");
        return;
      }
      
      return await addProjectMember(projectId, email.trim().toLowerCase(), role);
    } catch (error: any) {
      console.error("Fehler beim Teilen des Projekts:", error);
      
      // Spezifische Fehlermeldung basierend auf der Fehlermeldung
      if (error.message?.includes("already")) {
        toast.error("Der Benutzer ist bereits Mitglied dieses Projekts");
      } else if (error.message?.includes("not found")) {
        toast.error("Kein Benutzer mit dieser E-Mail gefunden");
      } else {
        toast.error("Projekt konnte nicht geteilt werden");
      }
      
      throw error;
    }
  };

  /**
   * Projekt mit einem anderen Benutzer teilen (per Benutzer-ID)
   */
  const shareProjectByUserId = async (projectId: string, userId: string, role: "editor" | "viewer") => {
    try {
      if (!userId.trim()) {
        toast.error("Ungültige Benutzer-ID");
        return;
      }
      
      return await addProjectMemberByUserId(projectId, userId.trim(), role);
    } catch (error: any) {
      console.error("Fehler beim Teilen des Projekts:", error);
      
      // Spezifische Fehlermeldung basierend auf der Fehlermeldung
      if (error.message?.includes("already")) {
        toast.error("Der Benutzer ist bereits Mitglied dieses Projekts");
      } else if (error.message?.includes("not found")) {
        toast.error("Benutzer nicht gefunden");
      } else {
        toast.error("Projekt konnte nicht geteilt werden");
      }
      
      throw error;
    }
  };

  /**
   * Zugriff auf ein Projekt entziehen
   */
  const revokeAccess = async (projectId: string, userId: string) => {
    try {
      if (!userId || !projectId) {
        toast.error("Ungültige Projekt- oder Benutzer-ID");
        return false;
      }
      
      return await removeProjectMember(projectId, userId);
    } catch (error: any) {
      console.error("Fehler beim Entziehen des Zugriffs:", error);
      
      if (error.message?.includes("owner")) {
        toast.error("Der Zugriff des Projekteigentümers kann nicht entzogen werden");
      } else {
        toast.error("Zugriff konnte nicht entzogen werden");
      }
      
      throw error;
    }
  };

  /**
   * Rolle eines Benutzers in einem Projekt ändern
   */
  const changeRole = async (projectId: string, userId: string, newRole: UserRole) => {
    try {
      if (!userId || !projectId || !newRole) {
        toast.error("Ungültige Parameter");
        return false;
      }
      
      return await updateProjectMemberRole(projectId, userId, newRole);
    } catch (error: any) {
      console.error("Fehler beim Ändern der Rolle:", error);
      
      if (error.message?.includes("owner")) {
        toast.error("Die Rolle des Projekteigentümers kann nicht geändert werden");
      } else {
        toast.error("Rolle konnte nicht geändert werden");
      }
      
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
