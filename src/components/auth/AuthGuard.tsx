
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useUser } from "@/context/UserContext";
import LoadingScreen from "./LoadingScreen";

const AuthGuard = () => {
  const { isAuthenticated, isLoading } = useUser();
  const location = useLocation();

  console.log("AuthGuard - isLoading:", isLoading, "isAuthenticated:", isAuthenticated);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    // Redirect to login page, but save the intended destination
    console.log("Not authenticated, redirecting to login");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  console.log("User is authenticated, rendering outlet");
  return <Outlet />;
};

export default AuthGuard;
