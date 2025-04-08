
import { Project } from "@/context/ProjectContext";
import ProjectCard from "./ProjectCard";

interface ProjectsGridProps {
  projects: Project[];
  currentUserId?: string;
}

const ProjectsGrid = ({ projects, currentUserId }: ProjectsGridProps) => {
  if (projects.length === 0) {
    return null;
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
      {projects.map((project) => (
        <ProjectCard 
          key={project.id} 
          project={project} 
          isOwned={currentUserId === project.ownerId}
        />
      ))}
    </div>
  );
};

export default ProjectsGrid;
