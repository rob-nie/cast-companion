
import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { ProjectMember, UserRole } from "@/types/user";
import { ProjectMembersContextType } from "./types";
import { 
  fetchProjectMembers, 
  addMemberByEmail, 
  addMemberByUserId, 
  updateMemberRole, 
  removeMember
} from "./projectMembersService";

const ProjectMembersContext = createContext<ProjectMembersContextType | undefined>(undefined);

export const ProjectMembersProvider = ({ children }: { children: ReactNode }) => {
  // Hook für zwischengespeicherte Mitgliederdaten
  const [memberCache, setMemberCache] = useState<Map<string, ProjectMember[]>>(new Map());
  
  /**
   * Mitglieder eines Projekts laden
   */
  const getProjectMembers = useCallback(async (projectId: string) => {
    try {
      const members = await fetchProjectMembers(projectId);
      // Aktualisieren des Caches
      setMemberCache(prev => {
        const newCache = new Map(prev);
        newCache.set(projectId, members);
        return newCache;
      });
      return members;
    } catch (error) {
      console.error('Fehler beim Laden der Projektmitglieder:', error);
      throw error;
    }
  }, []);

  /**
   * Mitglied per E-Mail hinzufügen
   */
  const addProjectMember = useCallback(async (projectId: string, email: string, role: UserRole) => {
    try {
      const newMember = await addMemberByEmail(projectId, email, role);
      // Cache aktualisieren, falls das Mitglied hinzugefügt wurde
      if (newMember) {
        setMemberCache(prev => {
          const newCache = new Map(prev);
          const existingMembers = newCache.get(projectId) || [];
          newCache.set(projectId, [...existingMembers, newMember]);
          return newCache;
        });
      }
      return newMember;
    } catch (error) {
      console.error('Fehler beim Hinzufügen eines Projektmitglieds:', error);
      throw error;
    }
  }, []);

  /**
   * Mitglied per Benutzer-ID hinzufügen
   */
  const addProjectMemberByUserId = useCallback(async (projectId: string, userId: string, role: UserRole) => {
    try {
      const newMember = await addMemberByUserId(projectId, userId, role);
      // Cache aktualisieren, falls das Mitglied hinzugefügt wurde
      if (newMember) {
        setMemberCache(prev => {
          const newCache = new Map(prev);
          const existingMembers = newCache.get(projectId) || [];
          newCache.set(projectId, [...existingMembers, newMember]);
          return newCache;
        });
      }
      return newMember;
    } catch (error) {
      console.error('Fehler beim Hinzufügen eines Projektmitglieds per ID:', error);
      throw error;
    }
  }, []);

  /**
   * Mitglied aus einem Projekt entfernen
   */
  const removeProjectMember = useCallback(async (projectId: string, userId: string) => {
    try {
      const success = await removeMember(projectId, userId);
      // Cache aktualisieren, falls das Mitglied entfernt wurde
      if (success) {
        setMemberCache(prev => {
          const newCache = new Map(prev);
          const existingMembers = newCache.get(projectId) || [];
          newCache.set(
            projectId, 
            existingMembers.filter(member => member.userId !== userId)
          );
          return newCache;
        });
      }
      return success;
    } catch (error) {
      console.error('Fehler beim Entfernen eines Projektmitglieds:', error);
      throw error;
    }
  }, []);

  /**
   * Die Rolle eines Projektmitglieds ändern
   */
  const updateProjectMemberRole = useCallback(async (projectId: string, userId: string, role: UserRole) => {
    try {
      const success = await updateMemberRole(projectId, userId, role);
      // Cache aktualisieren, falls die Rolle geändert wurde
      if (success) {
        setMemberCache(prev => {
          const newCache = new Map(prev);
          const existingMembers = newCache.get(projectId) || [];
          newCache.set(
            projectId, 
            existingMembers.map(member => 
              member.userId === userId ? { ...member, role } : member
            )
          );
          return newCache;
        });
      }
      return success;
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Mitgliederrolle:', error);
      throw error;
    }
  }, []);

  /**
   * Cache für ein bestimmtes Projekt löschen
   */
  const clearProjectCache = useCallback((projectId: string) => {
    setMemberCache(prev => {
      const newCache = new Map(prev);
      newCache.delete(projectId);
      return newCache;
    });
  }, []);

  return (
    <ProjectMembersContext.Provider
      value={{
        getProjectMembers,
        addProjectMember,
        addProjectMemberByUserId,
        removeProjectMember,
        updateProjectMemberRole,
        clearProjectCache
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
