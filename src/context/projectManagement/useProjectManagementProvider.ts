
import { useState, useEffect, useCallback } from "react";
import { useUser } from "../UserContext";
import { Project } from "./types";
import { 
  fetchProjects,
  addProjectToFirebase, 
  updateProjectInFirebase, 
  deleteProjectFromFirebase
} from "./projectService";
import { ProjectMember, UserRole } from "@/types/user";
import { toast } from "sonner";

export const useProjectManagementProvider = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const { user, isAuthenticated } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  // Optimierte Methode zum Laden der Projekte
  useEffect(() => {
    let unsubscribe: () => void = () => {};
    
    if (!isAuthenticated || !user) {
      setProjects([]);
      setCurrentProject(null);
      setIsLoading(false);
      return () => {};
    }
    
    setIsLoading(true);
    setLoadError(null);
    
    try {
      console.log("Lade Projekte für Benutzer:", user.id);
      
      // Callback vom Service für Projektaktualisierungen
      const handleProjectsUpdate = (loadedProjects: Project[]) => {
        setProjects(loadedProjects);
        setIsLoading(false);
        console.log(`${loadedProjects.length} Projekte geladen`);
      };
      
      // Abonnieren von Projekt-Updates
      unsubscribe = fetchProjects(user.id, handleProjectsUpdate);
    } catch (error) {
      console.error("Fehler beim Einrichten des Projekt-Abonnements:", error);
      setLoadError("Projekte konnten nicht geladen werden");
      setIsLoading(false);
    }
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isAuthenticated, user]);
  
  // Aktuelles Projekt zurücksetzen, wenn Benutzer sich abmeldet
  useEffect(() => {
    if (!isAuthenticated) {
      setCurrentProject(null);
    }
  }, [isAuthenticated]);

  // Projekt hinzufügen
  const addProject = useCallback(async (project: Omit<Project, "id" | "createdAt" | "ownerId">) => {
    if (!user) return;
    
    try {
      await addProjectToFirebase(project, user.id);
      // Echtzeit-Updates werden das Projekt zur Liste hinzufügen
    } catch (error) {
      console.error("Fehler beim Hinzufügen des Projekts:", error);
    }
  }, [user]);

  // Projekt aktualisieren mit optimierter Fehlerbehandlung
  const updateProject = useCallback(async (id: string, projectUpdate: Partial<Project>, silent: boolean = false) => {
    try {
      const success = await updateProjectInFirebase(id, projectUpdate, silent);
      
      if (success) {
        // Lokalen Status aktualisieren
        setProjects((prev) =>
          prev.map((project) =>
            project.id === id ? { ...project, ...projectUpdate } : project
          )
        );
        
        // Auch aktuelles Projekt aktualisieren, wenn es dasselbe ist
        if (currentProject?.id === id) {
          setCurrentProject(prev => prev ? { ...prev, ...projectUpdate } : null);
        }
      }
    } catch (error) {
      console.error("Fehler beim Aktualisieren des Projekts:", error);
    }
  }, [currentProject?.id]);
  
  // Projekt löschen mit optimierter Fehlerbehandlung
  const deleteProject = useCallback(async (id: string) => {
    // Überprüfen, ob der Benutzer Eigentümer ist
    const project = projects.find(p => p.id === id);
    
    if (project && project.ownerId !== user?.id) {
      toast.error("Du hast keine Berechtigung, dieses Projekt zu löschen");
      return;
    }
    
    try {
      const success = await deleteProjectFromFirebase(id);
      
      if (success) {
        // Lokalen Status aktualisieren
        setProjects((prev) => prev.filter((project) => project.id !== id));
        if (currentProject?.id === id) {
          setCurrentProject(null);
        }
      }
    } catch (error) {
      console.error("Fehler beim Löschen des Projekts:", error);
    }
  }, [projects, currentProject?.id, user?.id]);
  
  // Projekt-Mitglieder abrufen in optimierter Form
  const getProjectMembers = useCallback(async (projectId: string): Promise<ProjectMember[]> => {
    try {
      const project = projects.find(p => p.id === projectId);
      if (!project || !project.members) return [];
      
      // Mitglieds-Einträge in ein Array umwandeln und auflösen
      const memberPromises = Object.entries(project.members).map(async ([userId, memberData]) => {
        let name = "Unbekannter Benutzer";
        let email = "";
        let avatar = undefined;
        
        try {
          const userResponse = await fetch(`/api/users/${userId}`);
          if (userResponse.ok) {
            const userData = await userResponse.json();
            name = userData.name || name;
            email = userData.email || email;
            avatar = userData.avatar;
          }
        } catch (error) {
          console.error("Fehler beim Abrufen der Benutzerdetails:", error);
        }
        
        return {
          userId,
          projectId,
          role: memberData.role,
          name,
          email,
          avatar
        };
      });
      
      return Promise.all(memberPromises);
    } catch (error) {
      console.error("Fehler beim Abrufen der Projektmitglieder:", error);
      return [];
    }
  }, [projects]);
  
  // Projektfreigabe-Funktionen
  const shareProject = useCallback(async (projectId: string, email: string, role: "editor" | "viewer") => {
    try {
      // Import und Ausführung der Dienste für die Mitgliederverwaltung
      const { addMemberToProject } = await import('./projectService');
      await addMemberToProject(projectId, email, role);
    } catch (error) {
      console.error("Fehler bei der Projektfreigabe:", error);
      throw error;
    }
  }, []);
  
  const shareProjectByUserId = useCallback(async (projectId: string, userId: string, role: "editor" | "viewer") => {
    try {
      // Import und Ausführung der Dienste für die Mitgliederverwaltung
      const { addMemberToProjectByUserId } = await import('./projectService');
      await addMemberToProjectByUserId(projectId, userId, role);
    } catch (error) {
      console.error("Fehler bei der Projektfreigabe über Benutzer-ID:", error);
      throw error;
    }
  }, []);
  
  const revokeAccess = useCallback(async (projectId: string, userId: string) => {
    try {
      // Import und Ausführung der Dienste für die Mitgliederverwaltung
      const { removeMemberFromProject } = await import('./projectService');
      await removeMemberFromProject(projectId, userId);
    } catch (error) {
      console.error("Fehler beim Widerrufen des Zugriffs:", error);
      throw error;
    }
  }, []);
  
  const changeRole = useCallback(async (projectId: string, userId: string, newRole: UserRole) => {
    try {
      // Import und Ausführung der Dienste für die Mitgliederverwaltung
      const { updateMemberRole } = await import('./projectService');
      await updateMemberRole(projectId, userId, newRole);
    } catch (error) {
      console.error("Fehler beim Ändern der Rolle:", error);
      throw error;
    }
  }, []);

  return {
    projects,
    currentProject,
    setCurrentProject,
    addProject,
    updateProject,
    deleteProject,
    getProjectMembers,
    shareProject,
    shareProjectByUserId,
    revokeAccess,
    changeRole,
    isLoading,
    loadError
  };
};
