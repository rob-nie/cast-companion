
import { formatDistanceToNow } from "date-fns";
import { Calendar, Clock, Users, Shield } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Project, useProjects } from "@/context/ProjectContext";
import { useUser } from "@/context/UserContext";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

interface ProjectCardProps {
  project: Project;
}

const ProjectCard = ({ project }: ProjectCardProps) => {
  const { setCurrentProject } = useProjects();
  const { user, getProjectMembers } = useUser();
  const navigate = useNavigate();
  
  const isOwner = user?.id === project.ownerId;
  const members = getProjectMembers(project.id);

  const handleOpenProject = () => {
    setCurrentProject(project);
    navigate("/dashboard");
  };

  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-md hover:border-primary/20 animate-fade-in h-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold tracking-tight">{project.title}</CardTitle>
          {isOwner && (
            <Badge variant="outline" className="text-xs flex items-center gap-1 px-1.5 py-0">
              <Shield className="h-3 w-3" />
              <span>Besitzer</span>
            </Badge>
          )}
        </div>
        <CardDescription className="line-clamp-2 text-sm text-muted-foreground">
          {project.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <span>Erstellt {formatDistanceToNow(project.createdAt, { addSuffix: true })}</span>
        </div>
        {project.lastAccessed && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
            <Clock className="h-3.5 w-3.5" />
            <span>Zuletzt geöffnet {formatDistanceToNow(project.lastAccessed, { addSuffix: true })}</span>
          </div>
        )}
        {members.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
            <Users className="h-3.5 w-3.5" />
            <span>{members.length} Mitglieder</span>
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
          Projekt öffnen
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProjectCard;
