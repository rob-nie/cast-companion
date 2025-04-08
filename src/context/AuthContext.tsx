
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { toast } from "sonner";
import { User } from "@/types/user";
import { supabase } from "@/integrations/supabase/client";
import { Session, AuthError } from '@supabase/supabase-js';

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
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Listen for auth state changes
  useEffect(() => {
    console.log("Setting up auth state listener");
    
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state changed:", event);
        setSession(session);
        
        if (session?.user) {
          // Fetch user profile in a separate call to avoid deadlocks
          setTimeout(() => {
            fetchUserProfile(session.user.id);
          }, 0);
        } else {
          setUser(null);
          setIsLoading(false);
        }
      }
    );
    
    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      
      if (session?.user) {
        fetchUserProfile(session.user.id);
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
        
      if (error) throw error;
      
      if (data) {
        setUser({
          id: userId,
          email: data.email,
          name: data.name,
          avatar: data.avatar,
          createdAt: new Date(data.created_at)
        });
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      toast.error("Error loading user profile");
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      console.log("Attempting login with:", email);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      console.log("Login successful");
      // Auth state listener will handle the rest
    } catch (error: any) {
      console.error("Login error:", error);
      let errorMessage = "Login failed";
      
      if (error instanceof AuthError) {
        if (error.message.includes("Invalid login")) {
          errorMessage = "Invalid email or password";
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
        throw new Error("Failed to create user");
      }
      
      toast.success("Account created successfully");
      // The trigger function will create the profile and the auth state listener will handle the rest
    } catch (error: any) {
      let errorMessage = "Registration failed";
      
      if (error instanceof AuthError) {
        if (error.message.includes("already registered")) {
          errorMessage = "Email already registered";
        }
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
      
      toast.success("Successfully logged out");
      // Auth state listener will handle the rest
    } catch (error: any) {
      toast.error("Failed to log out");
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
