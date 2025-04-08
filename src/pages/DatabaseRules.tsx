
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const DatabaseRules = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the new Debug page
    navigate("/debug");
  }, [navigate]);

  // This will only show briefly during the redirect
  return <div>Weiterleitung zur Debug-Seite...</div>;
};

export default DatabaseRules;
