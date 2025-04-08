
import { useState, useEffect } from "react";
import { useProjects } from "@/context/ProjectContext";
import { useUser } from "@/context/UserContext";
import { toast } from "sonner";
import CreateProjectDialog from "./CreateProjectDialog";
import ProjectsSearch from "./ProjectsSearch";
import ProjectsEmptyState from "./ProjectsEmptyState";
import ProjectsLoadingState from "./ProjectsLoadingState";
import ProjectsErrorState from "./ProjectsErrorState";
import ProjectsGrid from "./ProjectsGrid";
import { Project } from "@/context/projectManagement";

const ProjectsOverview = () => {
  const { projects, isLoading } = useProjects();
  const { isAuthenticated, user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [retryCount, setRetryCount] = useState(0);
  
  // Filter projects when search term or projects change
  useEffect(() => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      setFilteredProjects(
        projects.filter(
          project => project.title.toLowerCase().includes(term) || 
                     project.description?.toLowerCase().includes(term)
        )
      );
    } else {
      setFilteredProjects(projects);
    }
  }, [searchTerm, projects]);

  // Log the number of projects loaded for debugging
  useEffect(() => {
    console.log(`ProjectsOverview: Loaded ${projects.length} total projects`);
  }, [projects]);
  
  const handleRetryLoading = () => {
    setRetryCount(prev => prev + 1);
    toast.info("Reloading projects...");
    // The effect will re-run because we're changing the key on useProjects below
  };

  const renderContent = () => {
    if (!isAuthenticated) {
      return (
        <ProjectsEmptyState 
          message="Bitte melde dich an" 
          description="Um deine Projekte zu sehen, musst du dich anmelden" 
        />
      );
    }
    
    if (isLoading) {
      return <ProjectsLoadingState retryCount={retryCount} />;
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
          onCreateClick={() => setIsOpen(true)}
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
          isLoading={isLoading}
          onRefresh={handleRetryLoading}
        />
      )}
      
      {renderContent()}
    </div>
  );
};

export default ProjectsOverview;
