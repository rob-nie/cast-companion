
import { Project } from "@/context/ProjectContext";
import ProjectCard from "./ProjectCard";
import { auth } from "@/lib/firebase";

type ProjectsListProps = {
  projects: Project[];
};

const ProjectsList = ({ projects }: ProjectsListProps) => {
  if (projects.length === 0) {
    return null;
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <ProjectCard 
          key={project.id} 
          project={project} 
          isOwned={auth.currentUser?.uid === project.ownerId}
        />
      ))}
    </div>
  );
};

export default ProjectsList;
