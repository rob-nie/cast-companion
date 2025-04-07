
import { Project } from "@/context/ProjectContext";
import ProjectCard from "./ProjectCard";
import { auth } from "@/lib/firebase";
import { useEffect } from "react";

type ProjectsListProps = {
  projects: Project[];
};

const ProjectsList = ({ projects }: ProjectsListProps) => {
  useEffect(() => {
    console.log("ProjectsList mounted with", projects?.length || 0, "projects");
    if (projects && projects.length > 0) {
      console.log("ProjectsList first project:", projects[0]);
    }
  }, []);
  
  useEffect(() => {
    console.log("ProjectsList: Projects updated, now showing", projects?.length || 0, "projects");
    if (projects && projects.length > 0) {
      projects.forEach(project => {
        console.log(`Project: ${project.id}, ${project.title}, owner: ${project.ownerId}`);
      });
    }
  }, [projects]);
  
  if (!projects || projects.length === 0) {
    console.log("ProjectsList: No projects to render");
    return (
      <div className="text-center py-12 text-muted-foreground">
        Keine Projekte gefunden.
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => {
        const isOwned = auth.currentUser?.uid === project.ownerId;
        console.log("ProjectsList: Rendering project", project.id, project.title, "isOwned:", isOwned);
        
        return (
          <ProjectCard 
            key={project.id} 
            project={project} 
            isOwned={isOwned}
          />
        );
      })}
    </div>
  );
};

export default ProjectsList;
