
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useUser } from "@/context/UserContext";
import LoadingScreen from "./LoadingScreen";

const AuthGuard = () => {
  const { isAuthenticated, isLoading } = useUser();
  const location = useLocation();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    // Redirect to login page, but save the intended destination
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default AuthGuard;
