
import { Project } from "@/context/ProjectContext";
import ProjectCard from "./ProjectCard";
import { auth } from "@/lib/firebase";
import { useEffect } from "react";

type ProjectsListProps = {
  projects: Project[];
};

const ProjectsList = ({ projects }: ProjectsListProps) => {
  useEffect(() => {
    console.log("==== ProjectsList Component Mounted ====");
    console.log("ProjectsList: Received", projects?.length || 0, "projects");
    console.log("ProjectsList: Current user:", auth.currentUser?.uid, auth.currentUser?.email);
    
    if (projects && projects.length > 0) {
      console.log("ProjectsList: Projects data overview:", 
        projects.map(p => ({
          id: p.id,
          title: p.title,
          ownerId: p.ownerId,
          owned: p.ownerId === auth.currentUser?.uid,
          createdAt: p.createdAt.toString()
        }))
      );
    } else {
      console.log("ProjectsList: No projects provided to component");
    }
  }, [projects]);
  
  if (!projects || projects.length === 0) {
    console.log("ProjectsList: Rendering empty state (no projects)");
    return (
      <div className="text-center py-12 text-muted-foreground">
        Keine Projekte gefunden.
      </div>
    );
  }
  
  console.log("ProjectsList: Rendering", projects.length, "project cards");
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => {
        const isOwned = auth.currentUser?.uid === project.ownerId;
        console.log(`ProjectsList: Rendering project ${project.id} (${project.title}), isOwned:`, isOwned);
        
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
