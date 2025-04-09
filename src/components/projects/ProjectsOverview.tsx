
import { useEffect, useState } from "react";
import { useProjectManagement } from "@/context/projectManagement";
import { useAuth } from "@/context/AuthContext";
import ProjectsGrid from "./ProjectsGrid";
import ProjectsSearch from "./ProjectsSearch";
import CreateProjectDialog from "./CreateProjectDialog";
import ProjectsLoadingState from "./ProjectsLoadingState";
import ProjectsEmptyState from "./ProjectsEmptyState";
import ProjectsErrorState from "./ProjectsErrorState";

const ProjectsOverview = () => {
  const { projects, isLoading, loadError, refresh } = useProjectManagement();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    refresh().catch(console.error);
  }, [refresh]);

  const filteredProjects = projects.filter(project => 
    project.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Render loading state
  if (isLoading) {
    return <ProjectsLoadingState />;
  }

  // Render error state
  if (loadError) {
    return (
      <ProjectsErrorState 
        message={loadError}
        onRetry={refresh} 
      />
    );
  }

  // Render empty state
  if (projects.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Meine Projekte</h2>
          <CreateProjectDialog />
        </div>
        <ProjectsEmptyState 
          message="Keine Projekte gefunden"
          onCreateClick={() => document.getElementById("create-project-trigger")?.click()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Meine Projekte</h2>
        <CreateProjectDialog />
      </div>
      
      <ProjectsSearch 
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        isLoading={isLoading}
        onRefresh={refresh}
      />
      
      <ProjectsGrid projects={filteredProjects} />
    </div>
  );
};

export default ProjectsOverview;
