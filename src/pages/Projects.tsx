
import { useEffect } from "react";
import PageLayout from "@/components/layout/PageLayout";
import ProjectsOverview from "@/components/projects/ProjectsOverview";
import { useProjects } from "@/context/ProjectContext";
import { auth } from "@/lib/firebase";

const Projects = () => {
  const { projects, isLoading } = useProjects();
  
  useEffect(() => {
    console.log("======= Projects page mounted =======");
    console.log("Projects page: Loaded with", projects.length, "projects");
    console.log("Projects page: Is loading?", isLoading);
    console.log("Projects page: Current user:", auth.currentUser?.email);
    console.log("Projects page: Current user ID:", auth.currentUser?.uid);
    
    if (projects.length > 0) {
      console.log("Projects page: First project:", projects[0].title);
      console.log("Projects page: All projects:", projects.map(p => ({
        id: p.id,
        title: p.title,
        ownerId: p.ownerId,
        owned: p.ownerId === auth.currentUser?.uid
      })));
    } else if (!isLoading) {
      console.log("Projects page: No projects available");
      console.log("Projects page: Auth status:", !!auth.currentUser);
    }
  }, [projects, isLoading]);
  
  return (
    <PageLayout>
      <ProjectsOverview />
    </PageLayout>
  );
};

export default Projects;
