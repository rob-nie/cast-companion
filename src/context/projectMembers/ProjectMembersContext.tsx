
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { ProjectMember } from "@/types/user";
import { ProjectMembersContextType, UserRole } from "./types";
import { 
  fetchProjectMembers as fetchMembers,
  addMemberToProject, 
  addMemberToProjectByUserId,
  removeMemberFromProject, 
  updateMemberRole 
} from "./projectMembersService";

const ProjectMembersContext = createContext<ProjectMembersContextType | undefined>(undefined);

export const ProjectMembersProvider = ({ children }: { children: ReactNode }) => {
  const [projectMembers, setProjectMembers] = useState<Map<string, ProjectMember[]>>(new Map());
  const [loading, setLoading] = useState<Map<string, boolean>>(new Map());

  // Verbesserte Set-Methode mit Cache-Invalidierung
  const setMembersForProject = useCallback((projectId: string, members: ProjectMember[]) => {
    setProjectMembers(prev => {
      const newMap = new Map(prev);
      newMap.set(projectId, members);
      return newMap;
    });
    
    setLoading(prev => {
      const newMap = new Map(prev);
      newMap.set(projectId, false);
      return newMap;
    });
  }, []);

  // Verbesserte Get-Methode mit Ladestatusmanagement
  const getProjectMembers = useCallback((projectId: string): ProjectMember[] => {
    // Return cached members if we have them and not currently loading
    if (projectMembers.has(projectId) && !loading.get(projectId)) {
      return projectMembers.get(projectId) || [];
    }
    
    // Start loading if not already loading
    if (!loading.get(projectId)) {
      setLoading(prev => {
        const newMap = new Map(prev);
        newMap.set(projectId, true);
        return newMap;
      });
      
      fetchMembers(projectId, setMembersForProject);
    }
    
    // Return cached members while loading, or empty array if no cache
    return projectMembers.get(projectId) || [];
  }, [projectMembers, loading, setMembersForProject]);

  // Optimierte Methoden zur Mitgliederverwaltung
  const addProjectMember = useCallback(async (projectId: string, email: string, role: UserRole) => {
    try {
      await addMemberToProject(projectId, email, role);
      // Mitglieder nach einer erfolgreichen Operation neu laden
      fetchMembers(projectId, setMembersForProject);
    } catch (error) {
      console.error("Fehler beim Hinzufügen des Mitglieds:", error);
      throw error;
    }
  }, [setMembersForProject]);

  const addProjectMemberByUserId = useCallback(async (projectId: string, userId: string, role: UserRole) => {
    try {
      await addMemberToProjectByUserId(projectId, userId, role);
      // Mitglieder nach einer erfolgreichen Operation neu laden
      fetchMembers(projectId, setMembersForProject);
    } catch (error) {
      console.error("Fehler beim Hinzufügen des Mitglieds über Benutzer-ID:", error);
      throw error;
    }
  }, [setMembersForProject]);

  const removeProjectMember = useCallback(async (projectId: string, userId: string) => {
    try {
      await removeMemberFromProject(projectId, userId);
      // Mitglieder aus dem lokalen Cache entfernen
      setProjectMembers(prev => {
        const newMap = new Map(prev);
        if (newMap.has(projectId)) {
          const members = newMap.get(projectId) || [];
          newMap.set(
            projectId, 
            members.filter(member => member.userId !== userId)
          );
        }
        return newMap;
      });
    } catch (error) {
      console.error("Fehler beim Entfernen des Mitglieds:", error);
      throw error;
    }
  }, []);

  const updateProjectMemberRole = useCallback(async (projectId: string, userId: string, role: UserRole) => {
    try {
      await updateMemberRole(projectId, userId, role);
      // Mitgliederrolle im lokalen Cache aktualisieren
      setProjectMembers(prev => {
        const newMap = new Map(prev);
        if (newMap.has(projectId)) {
          const members = newMap.get(projectId) || [];
          newMap.set(
            projectId, 
            members.map(member => 
              member.userId === userId ? { ...member, role } : member
            )
          );
        }
        return newMap;
      });
    } catch (error) {
      console.error("Fehler beim Aktualisieren der Mitgliedsrolle:", error);
      throw error;
    }
  }, []);
  
  // Cache-Bereinigung, wenn der Komponentenbaum entladen wird
  useEffect(() => {
    return () => {
      setProjectMembers(new Map());
      setLoading(new Map());
    };
  }, []);

  return (
    <ProjectMembersContext.Provider
      value={{
        getProjectMembers,
        addProjectMember,
        addProjectMemberByUserId,
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
