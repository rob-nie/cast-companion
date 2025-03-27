
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { toast } from "sonner";

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

// Mock user database - would be replaced with actual backend
const MOCK_USERS = [
  {
    id: "user-1",
    email: "demo@example.com",
    name: "Demo User",
    password: "password123", // In a real app, this would be hashed
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=user1",
    createdAt: new Date("2024-01-10")
  },
  {
    id: "user-2",
    email: "interviewer@example.com",
    name: "Interviewer",
    password: "password123",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=user2",
    createdAt: new Date("2024-01-15")
  }
];

// Mock project members
const MOCK_PROJECT_MEMBERS: ProjectMember[] = [
  {
    userId: "user-1",
    projectId: "1",
    role: "owner",
    name: "Demo User",
    email: "demo@example.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=user1"
  },
  {
    userId: "user-2",
    projectId: "1",
    role: "editor",
    name: "Interviewer",
    email: "interviewer@example.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=user2"
  },
  {
    userId: "user-1",
    projectId: "2",
    role: "owner",
    name: "Demo User",
    email: "demo@example.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=user1"
  }
];

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Auto-login for demo purposes
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        // Convert string date back to Date object
        parsedUser.createdAt = new Date(parsedUser.createdAt);
        setUser(parsedUser);
      } catch (error) {
        console.error("Failed to parse stored user:", error);
        localStorage.removeItem("user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const foundUser = MOCK_USERS.find(u => u.email === email && u.password === password);
      if (foundUser) {
        const { password, ...userWithoutPassword } = foundUser;
        setUser(userWithoutPassword);
        localStorage.setItem("user", JSON.stringify(userWithoutPassword));
        toast.success("Erfolgreich angemeldet");
      } else {
        throw new Error("Ungültige E-Mail oder Passwort");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Anmeldung fehlgeschlagen");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      if (MOCK_USERS.some(u => u.email === email)) {
        throw new Error("E-Mail wird bereits verwendet");
      }
      
      // In a real app, this would be done in the backend
      const newUser = {
        id: `user-${Date.now()}`,
        email,
        name,
        password,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
        createdAt: new Date()
      };
      
      // For demo purposes only - in reality, would be added to database
      MOCK_USERS.push(newUser);
      
      const { password: _, ...userWithoutPassword } = newUser;
      setUser(userWithoutPassword);
      localStorage.setItem("user", JSON.stringify(userWithoutPassword));
      toast.success("Konto erfolgreich erstellt");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Registrierung fehlgeschlagen");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    toast.success("Erfolgreich abgemeldet");
  };

  const updateProfile = async (data: Partial<User>) => {
    setIsLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      if (user) {
        const updatedUser = { ...user, ...data };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
        
        // Update in mock database
        const userIndex = MOCK_USERS.findIndex(u => u.id === user.id);
        if (userIndex !== -1) {
          MOCK_USERS[userIndex] = { ...MOCK_USERS[userIndex], ...data, password: MOCK_USERS[userIndex].password };
        }
        
        toast.success("Profil aktualisiert");
      }
    } catch (error) {
      toast.error("Profilaktualisierung fehlgeschlagen");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getProjectMembers = (projectId: string) => {
    return MOCK_PROJECT_MEMBERS.filter(member => member.projectId === projectId);
  };

  const addProjectMember = async (projectId: string, email: string, role: UserRole) => {
    // Find user by email
    const userToAdd = MOCK_USERS.find(u => u.email === email);
    if (!userToAdd) {
      toast.error("Benutzer nicht gefunden");
      throw new Error("Benutzer nicht gefunden");
    }
    
    // Check if already a member
    const isAlreadyMember = MOCK_PROJECT_MEMBERS.some(
      m => m.projectId === projectId && m.userId === userToAdd.id
    );
    
    if (isAlreadyMember) {
      toast.error("Benutzer ist bereits Mitglied dieses Projekts");
      throw new Error("Benutzer ist bereits Mitglied dieses Projekts");
    }
    
    // Add member
    const newMember: ProjectMember = {
      userId: userToAdd.id,
      projectId,
      role,
      name: userToAdd.name,
      email: userToAdd.email,
      avatar: userToAdd.avatar
    };
    
    MOCK_PROJECT_MEMBERS.push(newMember);
    toast.success(`${userToAdd.name} wurde zum Projekt hinzugefügt`);
  };

  const removeProjectMember = async (projectId: string, userId: string) => {
    const memberIndex = MOCK_PROJECT_MEMBERS.findIndex(
      m => m.projectId === projectId && m.userId === userId
    );
    
    if (memberIndex === -1) {
      toast.error("Mitglied nicht gefunden");
      throw new Error("Mitglied nicht gefunden");
    }
    
    // Check if removing owner
    const member = MOCK_PROJECT_MEMBERS[memberIndex];
    if (member.role === "owner") {
      toast.error("Der Projektinhaber kann nicht entfernt werden");
      throw new Error("Der Projektinhaber kann nicht entfernt werden");
    }
    
    // Remove member
    MOCK_PROJECT_MEMBERS.splice(memberIndex, 1);
    toast.success("Mitglied entfernt");
  };

  const updateProjectMemberRole = async (projectId: string, userId: string, role: UserRole) => {
    const memberIndex = MOCK_PROJECT_MEMBERS.findIndex(
      m => m.projectId === projectId && m.userId === userId
    );
    
    if (memberIndex === -1) {
      toast.error("Mitglied nicht gefunden");
      throw new Error("Mitglied nicht gefunden");
    }
    
    // Update role
    MOCK_PROJECT_MEMBERS[memberIndex].role = role;
    toast.success("Rolle aktualisiert");
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
