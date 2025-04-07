
import { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { toast } from "sonner";
import { useProjectMembers } from "./projectMembers";
import { useProjectManagement } from "./projectManagement";
import { auth, database } from "@/lib/firebase";
import { ref, get, onValue, query, orderByChild, equalTo } from "firebase/database";
import { Project } from "./projectManagement";

type ProjectSharingContextType = {
  shareProject: (projectId: string, email: string, role: "editor" | "viewer") => Promise<void>;
  revokeAccess: (projectId: string, userId: string) => Promise<void>;
  changeRole: (projectId: string, userId: string, newRole: "owner" | "editor" | "viewer") => Promise<void>;
  sharedProjects: Project[];
  isLoadingSharedProjects: boolean;
};

const ProjectSharingContext = createContext<ProjectSharingContextType | undefined>(undefined);

export const ProjectSharingProvider = ({ children }: { children: ReactNode }) => {
  const { addProjectMember, removeProjectMember, updateProjectMemberRole } = useProjectMembers();
  const { projects, currentProject } = useProjectManagement();
  const [sharedProjects, setSharedProjects] = useState<Project[]>([]);
  const [isLoadingSharedProjects, setIsLoadingSharedProjects] = useState(true);

  // Fetch shared projects using projectMembers collection
  useEffect(() => {
    console.log("Setting up shared projects listener");
    setIsLoadingSharedProjects(true);
    
    if (!auth.currentUser) {
      console.log("No user logged in, can't fetch shared projects");
      setSharedProjects([]);
      setIsLoadingSharedProjects(false);
      return () => {};
    }
    
    const userId = auth.currentUser.uid;
    console.log("Fetching shared projects for user:", userId);
    
    // Query project members for entries with the current user's ID
    const membersRef = ref(database, 'projectMembers');
    const userMembershipsQuery = query(
      membersRef, 
      orderByChild('userId'), 
      equalTo(userId)
    );
    
    const unsubscribe = onValue(userMembershipsQuery, async (snapshot) => {
      if (!snapshot.exists()) {
        console.log("No shared projects found for user");
        setSharedProjects([]);
        setIsLoadingSharedProjects(false);
        return;
      }
      
      try {
        console.log("Found shared project memberships, processing...");
        const memberships = snapshot.val();
        const sharedProjectIds = Object.values(memberships)
          .map((member: any) => member.projectId)
          .filter(Boolean);
        
        console.log("Shared project IDs:", sharedProjectIds);
        
        // Fetch all project details
        const projectDetails: Project[] = [];
        for (const projectId of sharedProjectIds) {
          try {
            const projectRef = ref(database, `projects/${projectId}`);
            const projectSnapshot = await get(projectRef);
            
            if (projectSnapshot.exists()) {
              const projectData = projectSnapshot.val();
              projectDetails.push({
                ...projectData,
                id: projectId,
                createdAt: new Date(projectData.createdAt),
                lastAccessed: projectData.lastAccessed ? new Date(projectData.lastAccessed) : undefined
              });
              console.log("Added shared project to list:", projectId, projectData.title);
            }
          } catch (error) {
            console.error("Error fetching shared project details:", error);
          }
        }
        
        console.log("Final shared projects list:", projectDetails.length, "projects");
        setSharedProjects(projectDetails);
      } catch (error) {
        console.error("Error processing shared projects:", error);
        toast.error("Fehler beim Laden geteilter Projekte");
      } finally {
        setIsLoadingSharedProjects(false);
      }
    }, (error) => {
      console.error("Error in shared projects listener:", error);
      setIsLoadingSharedProjects(false);
      setSharedProjects([]);
    });
    
    return () => {
      console.log("Cleaning up shared projects listener");
      unsubscribe();
    };
  }, [auth.currentUser?.uid]);

  // Share a project with another user
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
        sharedProjects,
        isLoadingSharedProjects
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
