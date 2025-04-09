
import { useState, useEffect } from "react";
import { useProjects } from "@/context/ProjectContext";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import CreateProjectDialog from "./CreateProjectDialog";
import ProjectsSearch from "./ProjectsSearch";
import ProjectsEmptyState from "./ProjectsEmptyState";
import ProjectsLoadingState from "./ProjectsLoadingState";
import ProjectsErrorState from "./ProjectsErrorState";
import ProjectsGrid from "./ProjectsGrid";
import { Project } from "@/context/projectManagement";

const ProjectsOverview = () => {
  const { projects, isLoading, loadError, refresh } = useProjects();
  const { isAuthenticated, user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  
  // Projekte filtern, wenn sich der Suchbegriff oder die Projekte ändern
  useEffect(() => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      setFilteredProjects(
        projects.filter(
          project => 
            project.title.toLowerCase().includes(term) || 
            (project.description?.toLowerCase().includes(term) || false)
        )
      );
    } else {
      setFilteredProjects(projects);
    }
  }, [searchTerm, projects]);

  // Anzahl der geladenen Projekte für Debugging protokollieren
  useEffect(() => {
    console.log(`ProjectsOverview: ${projects.length} Projekte geladen`);
  }, [projects]);
  
  const handleRefresh = async () => {
    if (refreshing) return;
    
    setRefreshing(true);
    toast.info("Projekte werden neu geladen...");
    
    try {
      await refresh();
      toast.success("Projekte erfolgreich aktualisiert");
    } catch (error) {
      console.error("Fehler beim Neuladen der Projekte:", error);
      toast.error("Projekte konnten nicht aktualisiert werden");
    } finally {
      setRefreshing(false);
    }
  };

  const renderContent = () => {
    if (!isAuthenticated) {
      return (
        <ProjectsEmptyState 
          message="Bitte melden Sie sich an" 
          description="Um Ihre Projekte zu sehen, müssen Sie sich anmelden" 
        />
      );
    }
    
    if (isLoading) {
      return <ProjectsLoadingState />;
    }
    
    if (loadError) {
      return <ProjectsErrorState errorMessage={loadError} onRetry={handleRefresh} />;
    }
    
    if (filteredProjects.length === 0) {
      if (searchTerm) {
        return (
          <ProjectsEmptyState 
            message="Keine Ergebnisse" 
            searchTerm={searchTerm}
          />
        );
      }
      
      return (
        <ProjectsEmptyState 
          message="Noch keine Projekte" 
          description="Erstellen Sie ein neues Projekt, um zu beginnen"
        />
      );
    }
    
    return <ProjectsGrid projects={filteredProjects} currentUserId={user?.id} />;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projekte</h1>
          <p className="text-muted-foreground mt-1">
            Verwalte deine Interview-Projekte
          </p>
        </div>
        <CreateProjectDialog />
      </div>

      {isAuthenticated && (
        <ProjectsSearch 
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          isLoading={isLoading || refreshing}
          onRefresh={handleRefresh}
        />
      )}
      
      {renderContent()}
    </div>
  );
};

export default ProjectsOverview;
