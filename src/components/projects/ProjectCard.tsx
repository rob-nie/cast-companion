
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useProjects } from "@/context/ProjectContext";
import { Project } from "@/context/ProjectContext";
import CardBadge from "./card/CardBadge";
import CardActions from "./card/CardActions";
import DeleteConfirmationDialog from "./card/DeleteConfirmationDialog";
import ProjectLastAccessed from "./card/ProjectLastAccessed";

interface ProjectCardProps {
  project: Project;
  isOwned: boolean;
}

const ProjectCard = ({ project, isOwned }: ProjectCardProps) => {
  const { setCurrentProject, deleteProject } = useProjects();
  const navigate = useNavigate();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleOpenProject = () => {
    setCurrentProject(project);
    navigate("/dashboard");
  };

  const handleShareProject = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentProject(project);
    navigate("/project-sharing");
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  const handleDelete = () => {
    deleteProject(project.id);
    setShowDeleteDialog(false);
  };

  return (
    <>
      <Card 
        className="overflow-hidden transition-all hover:shadow-md cursor-pointer"
        onClick={handleOpenProject}
      >
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-lg tracking-tight">{project.title}</h3>
            <CardBadge isOwned={isOwned} />
          </div>
          <p className="text-muted-foreground text-sm line-clamp-2">
            {project.description || "Keine Beschreibung"}
          </p>
        </CardContent>
        <CardFooter className="bg-muted/50 p-4 flex items-center justify-between">
          <ProjectLastAccessed 
            lastAccessed={project.lastAccessed} 
            createdAt={project.createdAt}
          />
          <CardActions 
            isOwned={isOwned}
            onShare={handleShareProject}
            onDelete={handleDeleteClick}
          />
        </CardFooter>
      </Card>

      <DeleteConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        projectTitle={project.title}
        onConfirm={handleDelete}
      />
    </>
  );
};

export default ProjectCard;
