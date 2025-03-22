
import { formatDistanceToNow } from "date-fns";
import { Calendar, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Project, useProjects } from "@/context/ProjectContext";
import { useNavigate } from "react-router-dom";

interface ProjectCardProps {
  project: Project;
}

const ProjectCard = ({ project }: ProjectCardProps) => {
  const { setCurrentProject } = useProjects();
  const navigate = useNavigate();

  const handleOpenProject = () => {
    setCurrentProject(project);
    navigate("/dashboard");
  };

  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-md hover:border-primary/20 animate-fade-in h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold tracking-tight">{project.title}</CardTitle>
        <CardDescription className="line-clamp-2 text-sm text-muted-foreground">
          {project.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <span>Created {formatDistanceToNow(project.createdAt, { addSuffix: true })}</span>
        </div>
        {project.lastAccessed && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
            <Clock className="h-3.5 w-3.5" />
            <span>Last accessed {formatDistanceToNow(project.lastAccessed, { addSuffix: true })}</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full transition-all duration-300 hover:bg-primary hover:text-primary-foreground" 
          onClick={handleOpenProject}
        >
          Open Project
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProjectCard;
