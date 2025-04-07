
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { toast } from "sonner";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile as updateFirebaseProfile,
} from "firebase/auth";
import { ref, set, get } from "firebase/database";
import { auth, database, initializeUserDatabaseAccess } from "@/lib/firebase";
import { User } from "@/types/user";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Listen for auth state changes
  useEffect(() => {
    console.log("Setting up auth state listener");
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("Auth state changed:", firebaseUser ? `User ${firebaseUser.email} logged in` : "No user");
      try {
        if (firebaseUser) {
          // Initialize database access for the user
          await initializeUserDatabaseAccess(firebaseUser.uid);
          
          // Try to get user data from database
          try {
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
          } catch (dbError) {
            console.error("Database error in auth state change handler:", dbError);
            // Even if database access fails, set basic user info from Firebase Auth
            setUser({
              id: firebaseUser.uid,
              email: firebaseUser.email || "",
              name: firebaseUser.displayName || "",
              avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.email}`,
              createdAt: new Date()
            });
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Error in auth state change handler:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    });
    
    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log("Attempting login for:", email);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("Login successful for:", email);
      
      // Wait a moment for the auth state to update
      setTimeout(() => {
        // If for some reason the auth state listener didn't catch this, set user manually
        if (!user && userCredential.user) {
          const firebaseUser = userCredential.user;
          setUser({
            id: firebaseUser.uid,
            email: firebaseUser.email || "",
            name: firebaseUser.displayName || "",
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.email}`,
            createdAt: new Date()
          });
        }
      }, 500);
      
      toast.success("Erfolgreich angemeldet");
    } catch (error: any) {
      console.error("Login error:", error);
      let errorMessage = "Anmeldung fehlgeschlagen";
      if (error.code === "auth/invalid-email" || error.code === "auth/wrong-password" || error.code === "auth/user-not-found") {
        errorMessage = "Ungültige E-Mail oder Passwort";
      }
      toast.error(errorMessage);
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      console.log("Attempting registration for:", email);
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Update display name
      await updateFirebaseProfile(firebaseUser, { displayName: name });
      
      // Create user entry in database
      try {
        const newUser = {
          id: firebaseUser.uid,
          email: email,
          name: name,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
          createdAt: new Date().toISOString()
        };
        
        await set(ref(database, `users/${firebaseUser.uid}`), newUser);
      } catch (dbError) {
        console.error("Failed to write user data to database:", dbError);
        // Continue anyway, as auth was successful
      }
      
      toast.success("Konto erfolgreich erstellt");
    } catch (error: any) {
      console.error("Registration error:", error);
      let errorMessage = "Registrierung fehlgeschlagen";
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "E-Mail wird bereits verwendet";
      }
      toast.error(errorMessage);
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log("Logging out");
      await signOut(auth);
      toast.success("Erfolgreich abgemeldet");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Abmeldung fehlgeschlagen");
      throw error;
    }
  };

  const contextValue: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
