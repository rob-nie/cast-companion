
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
import { auth, database } from "@/lib/firebase";
import { User } from "@/types/user";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Listen for auth state changes
  useEffect(() => {
    console.log("Setting up auth state listener");
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("Auth state changed:", firebaseUser);
      setIsLoading(true);
      
      try {
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
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast.error("Fehler beim Laden der Benutzerdaten");
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    });
    
    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      console.log("Attempting login with:", email);
      await signInWithEmailAndPassword(auth, email, password);
      console.log("Login credentials verified");
      // Auth state listener will handle the rest
    } catch (error: any) {
      console.error("Login error:", error);
      let errorMessage = "Anmeldung fehlgeschlagen";
      if (error.code === "auth/invalid-email" || error.code === "auth/wrong-password" || error.code === "auth/user-not-found") {
        errorMessage = "Ungültige E-Mail oder Passwort";
      } else if (error.code === "auth/api-key-not-valid.-please-pass-a-valid-api-key.") {
        errorMessage = "Firebase-Konfigurationsfehler. Bitte kontaktieren Sie den Administrator.";
      }
      toast.error(errorMessage);
      setIsLoading(false);
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string): Promise<void> => {
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
      // Auth state listener will handle the rest
    } catch (error: any) {
      let errorMessage = "Registrierung fehlgeschlagen";
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "E-Mail wird bereits verwendet";
      } else if (error.code === "auth/api-key-not-valid.-please-pass-a-valid-api-key.") {
        errorMessage = "Firebase-Konfigurationsfehler. Bitte kontaktieren Sie den Administrator.";
      }
      toast.error(errorMessage);
      setIsLoading(false);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await signOut(auth);
      toast.success("Erfolgreich abgemeldet");
      // Auth state listener will handle the rest
    } catch (error) {
      toast.error("Abmeldung fehlgeschlagen");
      console.error("Logout error:", error);
      setIsLoading(false);
    }
  };

  const contextValue = {
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
