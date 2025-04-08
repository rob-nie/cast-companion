
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../AuthContext";
import { Project } from "./types";
import { 
  fetchUserProjects,
  createProject as addProjectToSupabase, 
  updateProject as updateProjectInSupabase, 
  deleteProject as deleteProjectFromSupabase
} from "./projectService";
import { toast } from "sonner";

/**
 * Hook zur Verwaltung von Projekten
 */
export const useProjectManagementProvider = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const { user, isAuthenticated, session } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  // Projekte laden, wenn Benutzer authentifiziert ist oder sich die Session ändert
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setProjects([]);
      setCurrentProject(null);
      setIsLoading(false);
      return;
    }
    
    const loadProjects = async () => {
      setIsLoading(true);
      setLoadError(null);
      
      try {
        console.log("Lade Projekte für Benutzer:", user.id);
        
        const loadedProjects = await fetchUserProjects();
        setProjects(loadedProjects);
        
        // Wenn ein aktuelles Projekt gesetzt ist, aktualisiere es mit den neuen Daten
        if (currentProject) {
          const updatedCurrentProject = loadedProjects.find(p => p.id === currentProject.id);
          if (updatedCurrentProject) {
            setCurrentProject(updatedCurrentProject);
          } else {
            // Aktuelles Projekt wurde nicht gefunden, daher zurücksetzen
            setCurrentProject(null);
          }
        }
        
        console.log(`${loadedProjects.length} Projekte geladen`);
      } catch (error: any) {
        console.error("Fehler beim Laden der Projekte:", error);
        setLoadError("Projekte konnten nicht geladen werden");
        toast.error("Fehler beim Laden der Projekte");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProjects();
  }, [isAuthenticated, user, session?.access_token]);
  
  // Neues Projekt hinzufügen
  const addProject = useCallback(async (project: Omit<Project, "id" | "createdAt" | "ownerId" | "role">) => {
    if (!user) {
      toast.error("Nicht angemeldet");
      return;
    }
    
    try {
      setIsLoading(true);
      const newProject = await addProjectToSupabase(project);
      
      setProjects(prev => [newProject, ...prev]);
      setCurrentProject(newProject);
      toast.success("Projekt erfolgreich erstellt");
      
      return newProject;
    } catch (error) {
      console.error("Fehler beim Hinzufügen des Projekts:", error);
      toast.error("Projekt konnte nicht erstellt werden");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Projekt aktualisieren
  const updateProject = useCallback(async (
    id: string, 
    projectUpdate: Partial<Project>, 
    silent: boolean = false
  ) => {
    try {
      setIsLoading(true);
      const updatedProject = await updateProjectInSupabase(id, projectUpdate, silent);
      
      // Lokalen Status aktualisieren
      setProjects(prev =>
        prev.map(project =>
          project.id === id ? { ...project, ...updatedProject } : project
        )
      );
      
      // Auch das aktuelle Projekt aktualisieren, wenn es dasselbe ist
      if (currentProject?.id === id) {
        setCurrentProject(prev => prev ? { ...prev, ...updatedProject } : null);
      }
      
      if (!silent) {
        toast.success("Projekt erfolgreich aktualisiert");
      }
      
      return updatedProject;
    } catch (error) {
      console.error("Fehler beim Aktualisieren des Projekts:", error);
      if (!silent) {
        toast.error("Projekt konnte nicht aktualisiert werden");
      }
    } finally {
      setIsLoading(false);
    }
  }, [currentProject?.id]);
  
  // Projekt löschen
  const deleteProject = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      const success = await deleteProjectFromSupabase(id);
      
      if (success) {
        // Lokalen Status aktualisieren
        setProjects(prev => prev.filter(project => project.id !== id));
        
        if (currentProject?.id === id) {
          setCurrentProject(null);
        }
        
        toast.success("Projekt erfolgreich gelöscht");
        return true;
      }
      return false;
    } catch (error) {
      console.error("Fehler beim Löschen des Projekts:", error);
      toast.error("Projekt konnte nicht gelöscht werden");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [currentProject?.id]);
  
  // Funktion zum Aktualisieren des Zeitstempels für den letzten Zugriff auf das Projekt
  const updateProjectAccessTime = useCallback((projectId: string) => {
    if (!projectId) return;
    
    // Stille Aktualisierung, ohne Benachrichtigungen
    updateProjectInSupabase(
      projectId, 
      { updateLastAccessed: true }, 
      true
    ).catch(error => {
      console.error("Fehler beim Aktualisieren des Zugriffszeitpunkts:", error);
    });
  }, []);

  return {
    projects,
    currentProject,
    setCurrentProject: (project: Project | null) => {
      setCurrentProject(project);
      if (project?.id) {
        updateProjectAccessTime(project.id);
      }
    },
    addProject,
    updateProject,
    deleteProject,
    isLoading,
    loadError,
    refresh: async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        const loadedProjects = await fetchUserProjects();
        setProjects(loadedProjects);
        return loadedProjects;
      } catch (error: any) {
        setLoadError("Projekte konnten nicht geladen werden");
        throw error;
      } finally {
        setIsLoading(false);
      }
    }
  };
};
