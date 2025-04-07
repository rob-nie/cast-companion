
import { Project } from "@/context/ProjectContext";
import ProjectCard from "./ProjectCard";
import { auth } from "@/lib/firebase";

type ProjectsListProps = {
  projects: Project[];
};

const ProjectsList = ({ projects }: ProjectsListProps) => {
  console.log("ProjectsList: Rendering", projects.length, "projects");
  
  if (projects.length === 0) {
    console.log("ProjectsList: No projects to render");
    return null;
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => {
        const isOwned = auth.currentUser?.uid === project.ownerId;
        console.log("ProjectsList: Project", project.id, "is owned by user:", isOwned);
        
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
