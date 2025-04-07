
import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import LoadingScreen from "./LoadingScreen";
import { auth, database, initializeUserDatabaseAccess } from "@/lib/firebase";
import { toast } from "sonner";

const AuthGuard = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();
  
  useEffect(() => {
    // Log Firebase auth state whenever AuthGuard component renders
    const currentUser = auth.currentUser;
    console.log("AuthGuard Firebase currentUser:", currentUser ? currentUser.email : "Not authenticated");
    
    // Initialize database access if user is authenticated
    const setupDatabaseAccess = async () => {
      if (currentUser) {
        try {
          await initializeUserDatabaseAccess(currentUser.uid);
        } catch (error) {
          console.error("Failed to initialize database access:", error);
          toast.error("Fehler beim Zugriff auf die Datenbank");
        }
      }
    };
    
    setupDatabaseAccess();
  }, []);
  
  console.log("AuthGuard: isAuthenticated =", isAuthenticated, "isLoading =", isLoading, "user =", user?.email);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    // Redirect to login page, but save the intended destination
    console.log("AuthGuard: Not authenticated, redirecting to login");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  console.log("AuthGuard: Authenticated, allowing access");
  return <Outlet />;
};

export default AuthGuard;
