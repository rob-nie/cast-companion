import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { toast } from "sonner";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile as updateFirebaseProfile,
  User as FirebaseUser
} from "firebase/auth";
import { 
  ref, 
  set, 
  get, 
  push, 
  remove, 
  update,
  query,
  orderByChild,
  equalTo,
  onValue
} from "firebase/database";
import { auth, database } from "@/lib/firebase";

export type User = {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: Date;
};

type UserRole = "owner" | "editor" | "viewer";

export type ProjectMember = {
  userId: string;
  projectId: string;
  role: UserRole;
  name: string;
  email: string;
  avatar?: string;
};

type UserContextType = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  getProjectMembers: (projectId: string) => ProjectMember[];
  addProjectMember: (projectId: string, email: string, role: UserRole) => Promise<void>;
  removeProjectMember: (projectId: string, userId: string) => Promise<void>;
  updateProjectMemberRole: (projectId: string, userId: string, role: UserRole) => Promise<void>;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [projectMembers, setProjectMembers] = useState<Map<string, ProjectMember[]>>(new Map());
  
  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Get user data from database
        const userRef = ref(database, `users/${firebaseUser.uid}`);
        const snapshot = await get(userRef);
        
        if (snapshot.exists()) {
          const userData = snapshot.val();
          setUser({
            id: firebaseUser.uid,
            email: firebaseUser.email || "",
            name: userData.name || firebaseUser.displayName || "",
            avatar: userData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.email}`,
            createdAt: new Date(userData.createdAt)
          });
        } else {
          // Create user data if it doesn't exist
          const newUser = {
            id: firebaseUser.uid,
            email: firebaseUser.email || "",
            name: firebaseUser.displayName || "",
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.email}`,
            createdAt: new Date().toISOString()
          };
          
          await set(userRef, newUser);
          setUser({
            ...newUser,
            createdAt: new Date(newUser.createdAt)
          });
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Erfolgreich angemeldet");
    } catch (error: any) {
      let errorMessage = "Anmeldung fehlgeschlagen";
      if (error.code === "auth/invalid-email" || error.code === "auth/wrong-password" || error.code === "auth/user-not-found") {
        errorMessage = "Ungültige E-Mail oder Passwort";
      }
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Update display name
      await updateFirebaseProfile(firebaseUser, { displayName: name });
      
      // Create user entry in database
      const newUser = {
        id: firebaseUser.uid,
        email: email,
        name: name,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
        createdAt: new Date().toISOString()
      };
      
      await set(ref(database, `users/${firebaseUser.uid}`), newUser);
      toast.success("Konto erfolgreich erstellt");
    } catch (error: any) {
      let errorMessage = "Registrierung fehlgeschlagen";
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "E-Mail wird bereits verwendet";
      }
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      toast.success("Erfolgreich abgemeldet");
    } catch (error) {
      toast.error("Abmeldung fehlgeschlagen");
      console.error("Logout error:", error);
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    setIsLoading(true);
    try {
      if (!user) throw new Error("Kein Benutzer angemeldet");
      
      // Update the user data in the database
      const userRef = ref(database, `users/${user.id}`);
      await update(userRef, { ...data });
      
      // Update display name in Firebase Auth if it has changed
      if (data.name && auth.currentUser) {
        await updateFirebaseProfile(auth.currentUser, { displayName: data.name });
      }
      
      // Update local user state
      setUser(prev => prev ? { ...prev, ...data } : null);
      toast.success("Profil aktualisiert");
    } catch (error) {
      toast.error("Profilaktualisierung fehlgeschlagen");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

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
      // Find user by email
      const usersRef = ref(database, 'users');
      const emailQuery = query(usersRef, orderByChild('email'), equalTo(email));
      const snapshot = await get(emailQuery);
      
      if (!snapshot.exists()) {
        toast.error("Benutzer nicht gefunden");
        throw new Error("Benutzer nicht gefunden");
      }
      
      // Get the user ID
      let userId = "";
      let userData = null;
      
      snapshot.forEach((childSnapshot) => {
        userId = childSnapshot.key || "";
        userData = childSnapshot.val();
      });
      
      if (!userId) {
        toast.error("Benutzer nicht gefunden");
        throw new Error("Benutzer nicht gefunden");
      }
      
      // Check if user is already a member
      const membersRef = ref(database, 'projectMembers');
      const memberQuery = query(
        membersRef, 
        orderByChild('userId'), 
        equalTo(userId)
      );
      
      const memberSnapshot = await get(memberQuery);
      let isAlreadyMember = false;
      
      memberSnapshot.forEach((childSnapshot) => {
        const memberData = childSnapshot.val();
        if (memberData.projectId === projectId) {
          isAlreadyMember = true;
        }
      });
      
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
    <UserContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateProfile,
        getProjectMembers,
        addProjectMember,
        removeProjectMember,
        updateProjectMemberRole
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
