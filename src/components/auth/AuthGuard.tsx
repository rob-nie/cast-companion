
import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import LoadingScreen from "./LoadingScreen";
import { auth, database, initializeUserDatabaseAccess } from "@/lib/firebase";
import { toast } from "sonner";

const AuthGuard = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();
  const [localLoading, setLocalLoading] = useState(true);
  
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
      
      // Ensure we wait for a bit to let authentication status settle
      setTimeout(() => {
        setLocalLoading(false);
      }, 500);
    };
    
    setupDatabaseAccess();
  }, []);
  
  console.log("AuthGuard: isAuthenticated =", isAuthenticated, "isLoading =", isLoading, "user =", user?.email, "Firebase user =", auth.currentUser?.email);

  // Use either the global loading state or our local one
  const showLoading = isLoading || localLoading;

  if (showLoading) {
    return <LoadingScreen />;
  }

  // Check Firebase auth directly as a fallback if context is inconsistent
  const firebaseAuthenticated = !!auth.currentUser;

  if (!isAuthenticated && !firebaseAuthenticated) {
    // Redirect to login page, but save the intended destination
    console.log("AuthGuard: Not authenticated, redirecting to login");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  console.log("AuthGuard: Authenticated, allowing access");
  return <Outlet />;
};

export default AuthGuard;
