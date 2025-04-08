
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { toast } from "sonner";
import { User } from "@/types/user";
import { supabase } from "@/integrations/supabase/client";
import { Session, AuthError } from '@supabase/supabase-js';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to validate emails
const isValidEmail = (email: string): boolean => {
  // Basic regex for email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Listen for auth state changes
  useEffect(() => {
    console.log("Setting up auth state listener");
    
    // Set up auth state listener first to avoid missing events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log("Auth state changed:", event);
        setSession(newSession);
        
        if (newSession?.user) {
          // Use setTimeout to avoid potential deadlocks with Supabase client
          setTimeout(() => {
            fetchUserProfile(newSession.user.id);
          }, 0);
        } else {
          setUser(null);
          setIsLoading(false);
        }
      }
    );
    
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      
      if (existingSession?.user) {
        fetchUserProfile(existingSession.user.id);
      } else {
        setIsLoading(false);
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  // Helper to fetch user profile
  const fetchUserProfile = async (userId: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error) {
        console.error("Error fetching user profile:", error);
        toast.error("Fehler beim Laden des Profils");
        setUser(null);
        return;
      }
      
      if (data) {
        setUser({
          id: userId,
          email: data.email,
          name: data.name,
          avatar: data.avatar,
          createdAt: new Date(data.created_at || Date.now())
        });
      }
    } catch (error) {
      console.error("Fehler beim Laden des Nutzerprofils:", error);
      toast.error("Fehler beim Laden des Nutzerprofils");
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      console.log("Login-Versuch mit:", email);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      console.log("Login erfolgreich");
      toast.success("Erfolgreich angemeldet");
      // Auth state listener will handle the rest
    } catch (error: any) {
      console.error("Login-Fehler:", error);
      let errorMessage = "Login fehlgeschlagen";
      
      if (error instanceof AuthError) {
        if (error.message.includes("Invalid login")) {
          errorMessage = "Ungültige E-Mail oder Passwort";
        } else if (error.message.includes("Email not confirmed")) {
          errorMessage = "E-Mail wurde noch nicht bestätigt";
        } else if (error.message.includes("Too many requests")) {
          errorMessage = "Zu viele Anfragen. Bitte später erneut versuchen.";
        }
      }
      
      toast.error(errorMessage);
      setIsLoading(false);
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string): Promise<void> => {
    setIsLoading(true);
    
    try {
      // Pre-validate the email before sending to Supabase
      if (!isValidEmail(email)) {
        throw new Error("Bitte geben Sie eine gültige E-Mail-Adresse ein");
      }
      
      // Check for test/example domains that Supabase might reject
      if (email.endsWith('@example.com')) {
        throw new Error("Bitte verwenden Sie eine echte E-Mail-Adresse statt example.com");
      }
      
      // Create user in Supabase Auth
      const { data: { user }, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            full_name: name,
          }
        }
      });
      
      if (error) throw error;
      
      if (!user) {
        throw new Error("Benutzer konnte nicht erstellt werden");
      }
      
      toast.success("Konto erfolgreich erstellt");
      // The trigger function will create the profile and the auth state listener will handle the rest
    } catch (error: any) {
      console.error("Registrierung fehlgeschlagen:", error);
      let errorMessage = "Registrierung fehlgeschlagen";
      
      if (error instanceof AuthError) {
        if (error.message.includes("already registered")) {
          errorMessage = "E-Mail bereits registriert";
        } else if (error.message.includes("invalid")) {
          errorMessage = "Ungültiges E-Mail-Format";
        } else if (error.message.includes("email address")) {
          errorMessage = "E-Mail-Adresse wird nicht akzeptiert. Bitte verwenden Sie eine andere E-Mail.";
        } else if (error.message.includes("weak password")) {
          errorMessage = "Passwort zu schwach. Bitte verwenden Sie mindestens 6 Zeichen.";
        }
      } else if (error instanceof Error) {
        // Handle our custom errors
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      setIsLoading(false);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      toast.success("Erfolgreich abgemeldet");
      // Auth state listener will handle the rest
    } catch (error: any) {
      console.error("Logout-Fehler:", error);
      toast.error("Abmelden fehlgeschlagen");
      setIsLoading(false);
    }
  };

  const refreshSession = async (): Promise<void> => {
    try {
      const { error } = await supabase.auth.refreshSession();
      if (error) {
        console.error("Fehler beim Aktualisieren der Sitzung:", error);
      }
    } catch (error) {
      console.error("Fehler beim Aktualisieren der Sitzung:", error);
    }
  };

  const contextValue = {
    user,
    session,
    isLoading,
    isAuthenticated: !!user && !!session,
    login,
    register,
    logout,
    refreshSession
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
