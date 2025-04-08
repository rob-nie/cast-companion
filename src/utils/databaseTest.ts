
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TestResult {
  success: boolean;
  error?: string;
}

// Test-Methode für die Supabase-Datenbankverbindung
export const testSupabaseConnection = async (): Promise<TestResult> => {
  try {
    // Prüfen, ob eine gültige Supabase-Session existiert
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      toast.error("Nicht angemeldet. Bitte melden Sie sich an, um die Datenbankverbindung zu testen.");
      return { 
        success: false,
        error: "Keine aktive Sitzung gefunden"
      };
    }

    console.log("Teste Supabase-Verbindung...");
    
    // Versuchen, ein einfaches Profil abzurufen, um die Verbindung zu testen
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('id', session.user.id)
      .single();
    
    if (error) {
      console.error("Datenbankabfragefehler:", error);
      
      let errorMessage = "";
      
      if (error.message.includes("JWTError")) {
        errorMessage = "Authentifizierungsproblem: Ungültiges oder abgelaufenes Token.";
        toast.error(errorMessage);
      } else if (error.message.includes("permission denied")) {
        errorMessage = "Berechtigungsproblem: Die Datenbankregeln verhindern den Zugriff.";
        toast.error(errorMessage);
      } else if (error.message.includes("recursion detected")) {
        errorMessage = "Rekursionsproblem in den RLS-Richtlinien.";
        toast.error(errorMessage);
      } else {
        errorMessage = `Datenbankfehler: ${error.message}`;
        toast.error(errorMessage);
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
    
    console.log("Supabase-Verbindung erfolgreich getestet:", data);
    toast.success("Datenbankverbindung ist aktiv und funktioniert!");
    return { success: true };
  } catch (error: any) {
    console.error("Supabase-Verbindungsfehler:", error);
    
    let errorMessage = "";
    
    // Detaillierte Fehlermeldung
    if (error.message?.includes("JWT")) {
      errorMessage = "Authentifizierungsfehler: Problem mit dem Zugriffstoken.";
      toast.error(errorMessage);
    } else if (error.message?.includes("network error")) {
      errorMessage = "Netzwerkfehler: Keine Verbindung zu Supabase möglich.";
      toast.error(errorMessage);
    } else if (error.message?.includes("recursion")) {
      errorMessage = "Rekursionsproblem in den RLS-Richtlinien.";
      toast.error(errorMessage);
    } else {
      errorMessage = `Supabase-Fehler: ${error.message || "Unbekannter Fehler"}`;
      toast.error(errorMessage);
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
};

// Keep the firebase test method for backward compatibility
export const testDatabaseConnection = testSupabaseConnection;
