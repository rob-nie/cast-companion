
import { useEffect } from "react";
import { useProjectManagement } from "@/context/projectManagement";
import ProjectsGrid from "./ProjectsGrid";
import ProjectsSearch from "./ProjectsSearch";
import CreateProjectDialog from "./CreateProjectDialog";
import ProjectsLoadingState from "./ProjectsLoadingState";
import ProjectsEmptyState from "./ProjectsEmptyState";
import ProjectsErrorState from "./ProjectsErrorState";

const ProjectsOverview = () => {
  const { 
    projects, 
    isLoading, 
    error, 
    searchQuery, 
    setSearchQuery, 
    fetchProjects 
  } = useProjectManagement();

  useEffect(() => {
    fetchProjects().catch(console.error);
  }, [fetchProjects]);

  const filteredProjects = projects.filter(project => 
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Render Zustände
  if (isLoading) {
    return <ProjectsLoadingState />;
  }

  if (error) {
    return (
      <ProjectsErrorState 
        onRetry={fetchProjects} 
      />
    );
  }

  if (projects.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Meine Projekte</h2>
          <CreateProjectDialog />
        </div>
        <ProjectsEmptyState />
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
        searchQuery={searchQuery} 
        setSearchQuery={setSearchQuery} 
        resultsCount={filteredProjects.length}
        totalCount={projects.length}
      />
      
      <ProjectsGrid projects={filteredProjects} />
    </div>
  );
};

export default ProjectsOverview;
