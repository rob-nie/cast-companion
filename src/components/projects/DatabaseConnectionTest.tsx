
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { testDatabaseConnection } from "@/utils/databaseTest";
import { DatabaseIcon, CheckCircle, XCircle } from "lucide-react";

const DatabaseConnectionTest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<null | boolean>(null);

  const handleTest = async () => {
    setIsLoading(true);
    setConnectionStatus(null);
    
    try {
      const success = await testDatabaseConnection();
      setConnectionStatus(success);
    } catch (error) {
      console.error("Fehler beim Testen der Datenbankverbindung:", error);
      setConnectionStatus(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-2 p-4 border rounded-lg bg-muted/30 mt-4">
      <h3 className="text-lg font-semibold">Datenbankverbindung testen</h3>
      <p className="text-sm text-muted-foreground text-center mb-2">
        Prüft, ob die Verbindung zu Firebase funktioniert und die richtigen Berechtigungen vorhanden sind
      </p>
      
      <Button 
        onClick={handleTest} 
        disabled={isLoading}
        className="gap-2"
      >
        <DatabaseIcon className="h-4 w-4" />
        {isLoading ? "Verbindung wird getestet..." : "Datenbankverbindung testen"}
      </Button>
      
      {connectionStatus !== null && (
        <div className={`flex items-center gap-2 mt-2 text-sm ${
          connectionStatus ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500"
        }`}>
          {connectionStatus ? 
            <><CheckCircle className="h-4 w-4" /> Verbindung erfolgreich</> : 
            <><XCircle className="h-4 w-4" /> Verbindungsproblem (Details in Konsole)</>
          }
        </div>
      )}
    </div>
  );
};

export default DatabaseConnectionTest;
