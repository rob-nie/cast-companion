
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { ProjectMember, UserRole } from "@/types/user";
import { ProjectMembersContextType } from "./types";
import { MembershipStatus, ProjectMembershipCacheType } from "./serviceTypes";
import { 
  fetchProjectMembers as fetchMembers,
  addMemberByEmail, 
  addMemberByUserId,
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

  // Set method with cache invalidation
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

  // Get method with loading status management
  const getProjectMembers = useCallback(async (projectId: string): Promise<ProjectMember[]> => {
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
      try {
        const members = await fetchMembers(projectId);
        setMembersForProject(projectId, members);
        return members;
      } catch (error) {
        console.error("Error fetching members:", error);
        setMembershipCache(prev => {
          const newMap = new Map(prev);
          const current = newMap.get(projectId) || { isLoading: false, error: null, members: [] };
          
          newMap.set(projectId, {
            ...current,
            isLoading: false,
            error: "Error loading members"
          });
          
          return newMap;
        });
        return [];
      }
    }
    
    // Return cached members while loading, or empty array if no cache
    return (currentStatus && currentStatus.members) || [];
  }, [membershipCache, setMembersForProject]);

  // Optimized methods for member management
  const addProjectMember = useCallback(async (projectId: string, email: string, role: UserRole) => {
    try {
      await addMemberByEmail(projectId, email, role);
      
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
      
      // Reload members after successful operation
      const updatedMembers = await fetchMembers(projectId);
      setMembersForProject(projectId, updatedMembers);
    } catch (error) {
      console.error("Error adding member:", error);
      throw error;
    }
  }, [setMembersForProject]);

  const addProjectMemberByUserId = useCallback(async (projectId: string, userId: string, role: UserRole) => {
    try {
      await addMemberByUserId(projectId, userId, role);
      
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
      
      // Reload members after successful operation
      const updatedMembers = await fetchMembers(projectId);
      setMembersForProject(projectId, updatedMembers);
    } catch (error) {
      console.error("Error adding member by user ID:", error);
      throw error;
    }
  }, [setMembersForProject]);

  const removeProjectMember = useCallback(async (projectId: string, userId: string) => {
    try {
      await removeMemberFromProject(projectId, userId);
      
      // Remove member from local cache for immediate feedback
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
      console.error("Error removing member:", error);
      throw error;
    }
  }, []);

  const updateProjectMemberRole = useCallback(async (projectId: string, userId: string, role: UserRole) => {
    try {
      await updateMemberRole(projectId, userId, role);
      
      // Update member role in local cache for immediate feedback
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
      console.error("Error updating member role:", error);
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
