
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import LoadingScreen from "./LoadingScreen";

const AuthGuard = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();
  
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
