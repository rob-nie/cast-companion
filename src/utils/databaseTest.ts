
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
    
    // 1. Test: Direkter Schreibzugriff
    console.log("Teste Datenbank-Schreibzugriff...");
    const testRef = ref(database, `users/${uid}/connectionTest`);
    
    // Aktuelle Zeit als Test-Daten
    const testData = {
      timestamp: new Date().toISOString(),
      message: "Test erfolgreich"
    };
    
    await set(testRef, testData);
    console.log("Schreibvorgang erfolgreich!");
    
    // 2. Test: Lesezugriff auf die gerade geschriebenen Daten
    console.log("Teste Datenbank-Lesezugriff...");
    const snapshot = await get(testRef);
    
    if (snapshot.exists()) {
      console.log("Lesezugriff erfolgreich:", snapshot.val());
      toast.success("Datenbankverbindung ist aktiv und funktioniert!");
      return true;
    } else {
      console.error("Keine Daten gefunden, obwohl gerade geschrieben wurde.");
      toast.error("Datenproblem: Daten wurden geschrieben, konnten aber nicht gelesen werden.");
      return false;
    }
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
