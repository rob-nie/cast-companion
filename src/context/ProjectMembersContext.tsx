
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { toast } from "sonner";
import { 
  ref, 
  push,
  set,
  remove, 
  update,
  query,
  orderByChild,
  equalTo,
  onValue,
  get 
} from "firebase/database";
import { database } from "@/lib/firebase";
import { useAuth } from "./AuthContext";
import { ProjectMember } from "@/types/user";

type UserRole = "owner" | "editor" | "viewer";

type ProjectMembersContextType = {
  getProjectMembers: (projectId: string) => ProjectMember[];
  addProjectMember: (projectId: string, email: string, role: UserRole) => Promise<void>;
  removeProjectMember: (projectId: string, userId: string) => Promise<void>;
  updateProjectMemberRole: (projectId: string, userId: string, role: UserRole) => Promise<void>;
};

const ProjectMembersContext = createContext<ProjectMembersContextType | undefined>(undefined);

export const ProjectMembersProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [projectMembers, setProjectMembers] = useState<Map<string, ProjectMember[]>>(new Map());

  const getProjectMembers = (projectId: string): ProjectMember[] => {
    // Return cached members if we have them
    if (projectMembers.has(projectId)) {
      return projectMembers.get(projectId) || [];
    }
    
    // If not cached, return empty array and start fetching
    loadProjectMembers(projectId);
    return [];
  };

  // A separate function to load project members
  const loadProjectMembers = async (projectId: string) => {
    try {
      const membersRef = ref(database, 'projectMembers');
      const membersQuery = query(membersRef, orderByChild('projectId'), equalTo(projectId));
      
      onValue(membersQuery, async (snapshot) => {
        if (!snapshot.exists()) {
          setProjectMembers(prev => new Map(prev).set(projectId, []));
          return;
        }
        
        const members: ProjectMember[] = [];
        const membersData = snapshot.val();
        
        for (const key in membersData) {
          const member = membersData[key];
          
          // Get user details
          const userRef = ref(database, `users/${member.userId}`);
          const userSnapshot = await get(userRef);
          
          if (userSnapshot.exists()) {
            const userData = userSnapshot.val();
            members.push({
              userId: member.userId,
              projectId: member.projectId,
              role: member.role,
              name: userData.name || "Unknown User",
              email: userData.email || "",
              avatar: userData.avatar
            });
          }
        }
        
        setProjectMembers(prev => new Map(prev).set(projectId, members));
      });
    } catch (error) {
      console.error("Error getting project members:", error);
      setProjectMembers(prev => new Map(prev).set(projectId, []));
    }
  };

  const addProjectMember = async (projectId: string, email: string, role: UserRole) => {
    try {
      // Anstatt nach E-Mail zu suchen, holen wir alle Benutzer und filtern lokal
      const usersRef = ref(database, 'users');
      const snapshot = await get(usersRef);
      
      if (!snapshot.exists()) {
        toast.error("Keine Benutzer gefunden");
        throw new Error("Keine Benutzer gefunden");
      }
      
      // Auf der Client-Seite nach der E-Mail suchen
      let userId = "";
      let userData = null;
      let userFound = false;
      
      snapshot.forEach((childSnapshot) => {
        const user = childSnapshot.val();
        if (user.email === email) {
          userId = childSnapshot.key || "";
          userData = user;
          userFound = true;
        }
      });
      
      if (!userFound || !userId) {
        toast.error("Benutzer nicht gefunden");
        throw new Error("Benutzer nicht gefunden");
      }
      
      // Check if user is already a member
      const membersRef = ref(database, 'projectMembers');
      const memberSnapshot = await get(membersRef);
      let isAlreadyMember = false;
      
      if (memberSnapshot.exists()) {
        memberSnapshot.forEach((childSnapshot) => {
          const memberData = childSnapshot.val();
          if (memberData.projectId === projectId && memberData.userId === userId) {
            isAlreadyMember = true;
          }
        });
      }
      
      if (isAlreadyMember) {
        toast.error("Benutzer ist bereits Mitglied dieses Projekts");
        throw new Error("Benutzer ist bereits Mitglied dieses Projekts");
      }
      
      // Add member to project
      const newMemberRef = push(ref(database, 'projectMembers'));
      await set(newMemberRef, {
        userId,
        projectId,
        role
      });
      
      toast.success(`${userData.name} wurde zum Projekt hinzugefügt`);
    } catch (error: any) {
      console.error("Failed to add member:", error);
      if (!error.message.includes("bereits Mitglied") && !error.message.includes("nicht gefunden")) {
        toast.error("Fehler beim Hinzufügen des Mitglieds");
      }
      throw error;
    }
  };

  const removeProjectMember = async (projectId: string, userId: string) => {
    try {
      // Find the member entry
      const membersRef = ref(database, 'projectMembers');
      const memberQuery = query(
        membersRef,
        orderByChild('userId'),
        equalTo(userId)
      );
      
      const snapshot = await get(memberQuery);
      let memberKey = "";
      let memberRole = "";
      
      snapshot.forEach((childSnapshot) => {
        const memberData = childSnapshot.val();
        if (memberData.projectId === projectId) {
          memberKey = childSnapshot.key || "";
          memberRole = memberData.role;
        }
      });
      
      if (!memberKey) {
        toast.error("Mitglied nicht gefunden");
        throw new Error("Mitglied nicht gefunden");
      }
      
      // Check if removing owner
      if (memberRole === "owner") {
        toast.error("Der Projektinhaber kann nicht entfernt werden");
        throw new Error("Der Projektinhaber kann nicht entfernt werden");
      }
      
      // Remove member
      await remove(ref(database, `projectMembers/${memberKey}`));
      toast.success("Mitglied entfernt");
    } catch (error: any) {
      if (!error.message.includes("nicht gefunden") && !error.message.includes("Projektinhaber")) {
        toast.error("Fehler beim Entfernen des Mitglieds");
      }
      throw error;
    }
  };

  const updateProjectMemberRole = async (projectId: string, userId: string, role: UserRole) => {
    try {
      // Find the member entry
      const membersRef = ref(database, 'projectMembers');
      const memberQuery = query(
        membersRef,
        orderByChild('userId'),
        equalTo(userId)
      );
      
      const snapshot = await get(memberQuery);
      let memberKey = "";
      
      snapshot.forEach((childSnapshot) => {
        const memberData = childSnapshot.val();
        if (memberData.projectId === projectId) {
          memberKey = childSnapshot.key || "";
        }
      });
      
      if (!memberKey) {
        toast.error("Mitglied nicht gefunden");
        throw new Error("Mitglied nicht gefunden");
      }
      
      // Update role
      await update(ref(database, `projectMembers/${memberKey}`), { role });
      toast.success("Rolle aktualisiert");
    } catch (error) {
      toast.error("Fehler beim Aktualisieren der Rolle");
      throw error;
    }
  };

  return (
    <ProjectMembersContext.Provider
      value={{
        getProjectMembers,
        addProjectMember,
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
