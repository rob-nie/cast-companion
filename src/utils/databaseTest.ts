
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TestResult {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Testet die Verbindung zur Supabase-Datenbank und prüft grundlegende Berechtigungen
 */
export const testSupabaseConnection = async (): Promise<TestResult> => {
  try {
    // Prüfen, ob eine gültige Supabase-Session existiert
    const { data: sessionData } = await supabase.auth.getSession();
    
    if (!sessionData.session) {
      console.log("Keine aktive Sitzung gefunden");
      return { 
        success: false,
        message: "Nicht angemeldet",
        error: "Bitte melden Sie sich an, um die Datenbankverbindung zu testen."
      };
    }

    console.log("Supabase-Session gefunden, teste Datenbankverbindung...");
    
    // Versuchen, das eigene Profil abzurufen, um die Verbindung zu testen
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('id', sessionData.session.user.id)
      .single();
    
    if (profileError) {
      console.error("Datenbankabfragefehler:", profileError);
      
      let errorMessage = "";
      
      if (profileError.code === 'PGRST116') {
        errorMessage = "Ihr Profil wurde nicht gefunden. Bitte kontaktieren Sie den Support.";
      } else if (profileError.message.includes("JWTError")) {
        errorMessage = "Authentifizierungsproblem: Ungültiges oder abgelaufenes Token.";
      } else if (profileError.message.includes("permission denied")) {
        errorMessage = "Berechtigungsproblem: Die Datenbankregeln verhindern den Zugriff.";
      } else if (profileError.message.includes("recursion detected")) {
        errorMessage = "Rekursionsproblem in den Datenbankregeln. Bitte kontaktieren Sie den Support.";
      } else {
        errorMessage = `Datenbankfehler: ${profileError.message}`;
      }
      
      return {
        success: false,
        message: "Verbindungsproblem",
        error: errorMessage
      };
    }
    
    // Versuchen, ein Projekt abzurufen, um die Projektberechtigungen zu testen
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('id, title')
      .limit(1);
      
    if (projectError) {
      console.error("Projektabfragefehler:", projectError);
      
      return {
        success: false,
        message: "Problem mit Projektabfragen",
        error: `Projektdaten konnten nicht abgerufen werden: ${projectError.message}`
      };
    }
    
    console.log("Supabase-Verbindung erfolgreich getestet");
    return { 
      success: true,
      message: "Datenbankverbindung ist aktiv",
    };
  } catch (error: any) {
    console.error("Supabase-Verbindungsfehler:", error);
    
    let errorMessage = "";
    
    if (error.message?.includes("JWT")) {
      errorMessage = "Authentifizierungsfehler: Problem mit dem Zugriffstoken.";
    } else if (error.message?.includes("network error")) {
      errorMessage = "Netzwerkfehler: Keine Verbindung zu Supabase möglich.";
    } else {
      errorMessage = error.message || "Unbekannter Fehler";
    }
    
    return {
      success: false,
      message: "Verbindungsfehler",
      error: errorMessage
    };
  }
};
