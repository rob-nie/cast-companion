
import PageLayout from "@/components/layout/PageLayout";
import ProjectsOverview from "@/components/projects/ProjectsOverview";
import { useEffect } from "react";
import { useProjects } from "@/context/ProjectContext";

const Projects = () => {
  const { projects } = useProjects();
  
  useEffect(() => {
    console.log("Projects page: Loaded with", projects.length, "projects");
  }, [projects]);
  
  return (
    <PageLayout>
      <ProjectsOverview />
    </PageLayout>
  );
};

export default Projects;
