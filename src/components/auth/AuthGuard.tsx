
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import LoadingScreen from "./LoadingScreen";
import { useEffect, useState } from "react";

/**
 * Schützt Routen, die eine Authentifizierung erfordern
 * Leitet nicht authentifizierte Benutzer zur Login-Seite weiter
 */
const AuthGuard = () => {
  const { isAuthenticated, isLoading, user, session, refreshSession } = useAuth();
  const location = useLocation();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    // Session bei Bedarf aktualisieren
    if (!isLoading && !isAuthenticated && !authChecked) {
      refreshSession().catch(console.error);
      setAuthChecked(true);
    }
  }, [isLoading, isAuthenticated, authChecked, refreshSession]);

  useEffect(() => {
    // Dieser Effekt stellt sicher, dass wir erst weiterleiten, nachdem die Authentifizierungsprüfung abgeschlossen ist
    if (!isLoading) {
      // Eine kleine Verzögerung, um sicherzustellen, dass alle Auth-Zustände synchronisiert sind
      const timer = setTimeout(() => {
        setIsCheckingAuth(false);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  console.log("AuthGuard - isLoading:", isLoading, "isAuthenticated:", isAuthenticated, "user:", !!user, "session:", !!session);

  // Ladebildschirm während der Authentifizierungsprüfung anzeigen
  if (isLoading || isCheckingAuth) {
    return <LoadingScreen message="Authentifizierung wird überprüft..." />;
  }

  // Wenn nicht authentifiziert, zur Login-Seite weiterleiten
  if (!isAuthenticated || !user || !session) {
    console.log("Nicht authentifiziert, Weiterleitung zur Login-Seite");
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Benutzer ist authentifiziert, geschützte Route rendern
  console.log("Benutzer ist authentifiziert, Route wird gerendert");
  return <Outlet />;
};

export default AuthGuard;
