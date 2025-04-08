
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { testSupabaseConnection } from "@/utils/databaseTest";
import { DatabaseIcon, CheckCircle, AlertTriangle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

const DatabaseConnectionTest = () => {
  const { isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<null | boolean>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  const handleTest = async () => {
    setIsLoading(true);
    setConnectionStatus(null);
    setStatusMessage(null);
    setErrorDetails(null);
    
    if (!isAuthenticated) {
      toast.error("Bitte melden Sie sich an, um die Datenbankverbindung zu testen");
      setIsLoading(false);
      return;
    }
    
    try {
      const result = await testSupabaseConnection();
      setConnectionStatus(result.success);
      setStatusMessage(result.message || null);
      
      if (!result.success && result.error) {
        setErrorDetails(result.error);
        toast.error(result.error);
      } else if (result.success) {
        toast.success(result.message || "Verbindung erfolgreich getestet");
      }
    } catch (error: any) {
      console.error("Fehler beim Testen der Datenbankverbindung:", error);
      setConnectionStatus(false);
      setErrorDetails(error?.message || "Unbekannter Fehler");
      toast.error("Fehler beim Testen der Verbindung");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-2 p-4 border rounded-lg bg-muted/30 mt-4">
      <h3 className="text-lg font-semibold">Datenbankverbindung testen</h3>
      <p className="text-sm text-muted-foreground text-center mb-2">
        Prüft, ob die Verbindung zu Supabase funktioniert und die richtigen Berechtigungen vorhanden sind
      </p>
      
      <Button 
        onClick={handleTest} 
        disabled={isLoading}
        className="gap-2"
      >
        {isLoading ? (
          <>
            <RefreshCw className="h-4 w-4 animate-spin" />
            Verbindung wird getestet...
          </>
        ) : (
          <>
            <DatabaseIcon className="h-4 w-4" />
            Datenbankverbindung testen
          </>
        )}
      </Button>
      
      {connectionStatus !== null && (
        <div className="w-full mt-2">
          {connectionStatus ? (
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-500">
              <CheckCircle className="h-4 w-4" /> 
              <span>{statusMessage || "Verbindung erfolgreich"}</span>
            </div>
          ) : (
            <Alert variant="destructive" className="mt-2">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="flex flex-col gap-1">
                <span>{statusMessage}: {errorDetails || "Unbekannter Fehler"}</span>
                {errorDetails?.includes("recursion") && (
                  <span className="text-xs mt-1">
                    Hinweis: Bei Rekursionsfehlern müssen die RLS-Richtlinien angepasst werden.
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
};

export default DatabaseConnectionTest;
