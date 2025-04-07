
import { auth } from "@/lib/firebase";
import { toast } from "sonner";
import { isProjectEditor } from "./isProjectEditor";
import { canViewProject } from "./canViewProject";

/**
 * Wrapper-Funktion zum Ausführen mit Berechtigungsprüfung
 * @param projectId Die Projekt-ID
 * @param requiresEdit Ob Bearbeitungsberechtigungen erforderlich sind
 * @param action Die auszuführende Aktion wenn berechtigt
 * @param errorMessage Fehlermeldung bei fehlender Berechtigung
 */
export const withProjectPermission = async <T>(
  projectId: string,
  requiresEdit: boolean,
  action: () => Promise<T>,
  errorMessage: string = "Keine ausreichenden Berechtigungen"
): Promise<T> => {
  if (!auth.currentUser) {
    toast.error("Nicht angemeldet");
    throw new Error("Not authenticated");
  }
  
  // Berechtigungsprüfung
  const hasPermission = requiresEdit 
    ? await isProjectEditor(projectId)
    : await canViewProject(projectId);
  
  if (!hasPermission) {
    toast.error(errorMessage);
    throw new Error(errorMessage);
  }
  
  // Aktion ausführen wenn berechtigt
  return action();
};
