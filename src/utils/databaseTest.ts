
import { ref, set, get } from "firebase/database";
import { database, auth } from "@/lib/firebase";
import { toast } from "sonner";

// Test-Methode für die Datenbankverbindung
export const testDatabaseConnection = async (): Promise<boolean> => {
  try {
    // Prüfen, ob der Nutzer angemeldet ist
    if (!auth.currentUser) {
      toast.error("Nicht angemeldet. Bitte melden Sie sich an, um die Datenbankverbindung zu testen.");
      return false;
    }

    const uid = auth.currentUser.uid;
    
    // 1. Test: Versuche Daten zu lesen
    console.log("Teste Datenbank-Lesezugriff...");
    const readTestRef = ref(database, '.info/connected');
    const connectedSnapshot = await get(readTestRef);
    const isConnected = connectedSnapshot.val();
    
    if (isConnected) {
      console.log("Datenbank-Verbindung hergestellt!");
    } else {
      console.error("Datenbank nicht verbunden.");
      toast.error("Keine Verbindung zur Datenbank.");
      return false;
    }
    
    // 2. Test: Versuche Daten zu schreiben
    console.log("Teste Datenbank-Schreibzugriff...");
    const testRef = ref(database, `users/${uid}/connectionTest`);
    
    // Aktuelle Zeit als Test-Daten
    await set(testRef, {
      timestamp: new Date().toISOString(),
      message: "Test erfolgreich"
    });
    
    console.log("Schreibvorgang erfolgreich!");
    toast.success("Datenbankverbindung ist aktiv und funktioniert!");
    return true;
  } catch (error) {
    console.error("Datenbankfehler:", error);
    
    // Detaillierte Fehlermeldung
    if (error instanceof Error) {
      if (error.message.includes("PERMISSION_DENIED")) {
        toast.error("Berechtigungsfehler: Firebase-Regeln blockieren den Zugriff auf die Datenbank.");
      } else if (error.message.includes("network error")) {
        toast.error("Netzwerkfehler: Keine Verbindung zur Datenbank möglich.");
      } else {
        toast.error(`Datenbankfehler: ${error.message}`);
      }
    } else {
      toast.error("Unbekannter Datenbank-Fehler");
    }
    
    return false;
  }
};
