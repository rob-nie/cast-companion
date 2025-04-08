
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { ProjectMember, UserRole } from "@/types/user";
import { ProjectMembersContextType } from "./types";
import { MembershipStatus, ProjectMembershipCacheType } from "./serviceTypes";
import { 
  fetchProjectMembers as fetchMembers,
  addMemberToProject, 
  addMemberToProjectByUserId,
  removeMemberFromProject, 
  updateMemberRole 
} from "./projectMembersService";

const ProjectMembersContext = createContext<ProjectMembersContextType | undefined>(undefined);

export const ProjectMembersProvider = ({ children }: { children: ReactNode }) => {
  const [membershipCache, setMembershipCache] = useState<ProjectMembershipCacheType>(new Map());
  
  // Cleanup on unmount
  useEffect(() => {
    const cleanupFunctions: (() => void)[] = [];
    
    return () => {
      cleanupFunctions.forEach(cleanup => cleanup());
    };
  }, []);

  // Verbesserte Set-Methode mit Cache-Invalidierung
  const setMembersForProject = useCallback((projectId: string, members: ProjectMember[]) => {
    setMembershipCache(prev => {
      const newMap = new Map(prev);
      const currentStatus = newMap.get(projectId) || { isLoading: false, error: null, members: [] };
      
      newMap.set(projectId, {
        ...currentStatus,
        isLoading: false,
        error: null,
        members
      });
      
      return newMap;
    });
  }, []);

  // Verbesserte Get-Methode mit Ladestatusmanagement
  const getProjectMembers = useCallback((projectId: string): ProjectMember[] => {
    // Check if we already have data and it's not loading
    const currentStatus = membershipCache.get(projectId);
    
    if (currentStatus && !currentStatus.isLoading && currentStatus.members.length > 0) {
      return currentStatus.members;
    }
    
    // Start loading if not already loading
    if (!currentStatus || !currentStatus.isLoading) {
      setMembershipCache(prev => {
        const newMap = new Map(prev);
        const current = newMap.get(projectId) || { isLoading: false, error: null, members: [] };
        
        newMap.set(projectId, {
          ...current,
          isLoading: true,
          error: null
        });
        
        return newMap;
      });
      
      // Fetch the data
      fetchMembers(projectId, setMembersForProject)
        .then(cleanup => {
          // Store cleanup function for later
          return () => {
            if (cleanup) cleanup();
          };
        })
        .catch(error => {
          console.error("Fehler beim Einrichten des Mitgliederabrufs:", error);
          setMembershipCache(prev => {
            const newMap = new Map(prev);
            const current = newMap.get(projectId) || { isLoading: false, error: null, members: [] };
            
            newMap.set(projectId, {
              ...current,
              isLoading: false,
              error: "Fehler beim Laden der Mitglieder"
            });
            
            return newMap;
          });
        });
    }
    
    // Return cached members while loading, or empty array if no cache
    return (currentStatus && currentStatus.members) || [];
  }, [membershipCache]);

  // Optimierte Methoden zur Mitgliederverwaltung
  const addProjectMember = useCallback(async (projectId: string, email: string, role: UserRole) => {
    try {
      await addMemberToProject(projectId, email, role);
      
      // Invalidate cache to trigger reload
      setMembershipCache(prev => {
        const newMap = new Map(prev);
        const current = newMap.get(projectId);
        
        if (current) {
          newMap.set(projectId, {
            ...current,
            isLoading: true
          });
        }
        
        return newMap;
      });
      
      // Mitglieder nach einer erfolgreichen Operation neu laden
      await fetchMembers(projectId, setMembersForProject);
    } catch (error) {
      console.error("Fehler beim Hinzufügen des Mitglieds:", error);
      throw error;
    }
  }, [setMembersForProject]);

  const addProjectMemberByUserId = useCallback(async (projectId: string, userId: string, role: UserRole) => {
    try {
      await addMemberToProjectByUserId(projectId, userId, role);
      
      // Invalidate cache to trigger reload
      setMembershipCache(prev => {
        const newMap = new Map(prev);
        const current = newMap.get(projectId);
        
        if (current) {
          newMap.set(projectId, {
            ...current,
            isLoading: true
          });
        }
        
        return newMap;
      });
      
      // Mitglieder nach einer erfolgreichen Operation neu laden
      await fetchMembers(projectId, setMembersForProject);
    } catch (error) {
      console.error("Fehler beim Hinzufügen des Mitglieds über Benutzer-ID:", error);
      throw error;
    }
  }, [setMembersForProject]);

  const removeProjectMember = useCallback(async (projectId: string, userId: string) => {
    try {
      await removeMemberFromProject(projectId, userId);
      
      // Mitglieder aus dem lokalen Cache entfernen für sofortige Rückmeldung
      setMembershipCache(prev => {
        const newMap = new Map(prev);
        const current = newMap.get(projectId);
        
        if (current) {
          newMap.set(projectId, {
            ...current,
            members: current.members.filter(member => member.userId !== userId)
          });
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
      
      // Mitgliederrolle im lokalen Cache aktualisieren für sofortige Rückmeldung
      setMembershipCache(prev => {
        const newMap = new Map(prev);
        const current = newMap.get(projectId);
        
        if (current) {
          newMap.set(projectId, {
            ...current,
            members: current.members.map(member => 
              member.userId === userId ? { ...member, role } : member
            )
          });
        }
        
        return newMap;
      });
    } catch (error) {
      console.error("Fehler beim Aktualisieren der Mitgliedsrolle:", error);
      throw error;
    }
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
