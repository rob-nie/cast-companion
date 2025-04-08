import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Test-Methode für die Supabase-Datenbankverbindung
export const testSupabaseConnection = async (): Promise<boolean> => {
  try {
    // Prüfen, ob eine gültige Supabase-Session existiert
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      toast.error("Nicht angemeldet. Bitte melden Sie sich an, um die Datenbankverbindung zu testen.");
      return false;
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
      
      if (error.message.includes("JWTError")) {
        toast.error("Authentifizierungsproblem: Ungültiges oder abgelaufenes Token.");
      } else if (error.message.includes("permission denied")) {
        toast.error("Berechtigungsproblem: Die Datenbankregeln verhindern den Zugriff.");
      } else {
        toast.error(`Datenbankfehler: ${error.message}`);
      }
      
      return false;
    }
    
    console.log("Supabase-Verbindung erfolgreich getestet:", data);
    toast.success("Datenbankverbindung ist aktiv und funktioniert!");
    return true;
  } catch (error: any) {
    console.error("Supabase-Verbindungsfehler:", error);
    
    // Detaillierte Fehlermeldung
    if (error.message?.includes("JWT")) {
      toast.error("Authentifizierungsfehler: Problem mit dem Zugriffstoken.");
    } else if (error.message?.includes("network error")) {
      toast.error("Netzwerkfehler: Keine Verbindung zu Supabase möglich.");
    } else {
      toast.error(`Supabase-Fehler: ${error.message || "Unbekannter Fehler"}`);
    }
    
    return false;
  }
};

// Keep the firebase test method for backward compatibility
export const testDatabaseConnection = testSupabaseConnection;
