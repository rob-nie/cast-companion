
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useUser } from "@/context/UserContext";
import LoadingScreen from "./LoadingScreen";

const AuthGuard = () => {
  const { isAuthenticated, isLoading } = useUser();
  const location = useLocation();

  console.log("AuthGuard - isLoading:", isLoading, "isAuthenticated:", isAuthenticated);

  // Show loading screen while checking authentication
  if (isLoading) {
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
