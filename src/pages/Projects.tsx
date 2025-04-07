
import PageLayout from "@/components/layout/PageLayout";
import ProjectsOverview from "@/components/projects/ProjectsOverview";
import { useEffect } from "react";
import { useProjects } from "@/context/ProjectContext";
import { auth } from "@/lib/firebase";

const Projects = () => {
  const { projects } = useProjects();
  
  useEffect(() => {
    console.log("Projects page: Loaded with", projects.length, "projects");
    console.log("Projects page: Current user:", auth.currentUser?.email);
    console.log("Projects page: Projects data:", JSON.stringify(projects));
  }, [projects]);
  
  return (
    <PageLayout>
      <ProjectsOverview />
    </PageLayout>
  );
};

export default Projects;
