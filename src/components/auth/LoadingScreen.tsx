
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";

const LoadingScreen = () => {
  const [loadingTime, setLoadingTime] = useState(0);
  
  // Count seconds for extended loading
  useEffect(() => {
    const timer = setInterval(() => {
      setLoadingTime(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  // Show more detailed message if loading takes too long
  const showDetailedMessage = loadingTime > 5;
  const currentUser = auth.currentUser;
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="text-center">
        <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
        <p className="mt-4 text-muted-foreground">Bitte warten...</p>
        <p className="mt-2 text-xs text-muted-foreground">
          Die Anwendung wird geladen und Authentifizierung überprüft
        </p>
        
        {showDetailedMessage && (
          <div className="mt-6 max-w-md p-4 border rounded-md bg-muted/50">
            <p className="text-sm font-medium">Status-Information:</p>
            <p className="text-xs mt-1 text-left">
              Firebase Benutzer: {currentUser ? `Angemeldet als ${currentUser.email}` : 'Nicht angemeldet'}
            </p>
            <p className="text-xs mt-1 text-left">
              Ladezeit: {loadingTime} Sekunden
            </p>
            {loadingTime > 10 && (
              <div className="mt-3">
                <p className="text-xs text-amber-600">
                  Die Anmeldung dauert länger als gewöhnlich. 
                  Wenn dies weiterhin passiert, bitte die Seite neu laden.
                </p>
                <button 
                  onClick={() => window.location.reload()}
                  className="mt-2 text-xs px-2 py-1 bg-primary text-white rounded-md hover:bg-primary/90"
                >
                  Seite neu laden
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadingScreen;
