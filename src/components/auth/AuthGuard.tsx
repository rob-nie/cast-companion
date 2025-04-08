
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useUser } from "@/context/UserContext";
import LoadingScreen from "./LoadingScreen";
import { useEffect, useState } from "react";

const AuthGuard = () => {
  const { isAuthenticated, isLoading } = useUser();
  const location = useLocation();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    // This effect helps ensure we only redirect after auth check is complete
    if (!isLoading) {
      // Give a small delay to ensure all auth states are synchronized
      const timer = setTimeout(() => {
        setIsCheckingAuth(false);
      }, 200);
      
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  console.log("AuthGuard - isLoading:", isLoading, "isAuthenticated:", isAuthenticated, "isCheckingAuth:", isCheckingAuth);

  // Show loading screen while checking authentication
  if (isLoading || isCheckingAuth) {
    return <LoadingScreen />;
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    console.log("Not authenticated, redirecting to login");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // User is authenticated, render the protected route
  console.log("User is authenticated, rendering outlet");
  return <Outlet />;
};

export default AuthGuard;
