
import { CalendarIcon, Share2, Trash2, FolderHeart, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useProjects } from "@/context/ProjectContext";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const ProjectCard = ({ project, isOwned }) => {
  const { setCurrentProject, deleteProject } = useProjects();
  const navigate = useNavigate();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleOpenProject = () => {
    setCurrentProject(project);
    navigate("/dashboard");
  };

  const handleShareProject = (e) => {
    e.stopPropagation();
    setCurrentProject(project);
    navigate("/project-sharing");
  };

  const handleDeleteClick = (e) => {
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
            <Badge variant={isOwned ? "default" : "secondary"} className="flex items-center gap-1">
              {isOwned ? (
                <>
                  <FolderHeart className="h-3 w-3" />
                  <span>Eigenes</span>
                </>
              ) : (
                <>
                  <Users className="h-3 w-3" />
                  <span>Geteilt</span>
                </>
              )}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm line-clamp-2">
            {project.description || "Keine Beschreibung"}
          </p>
        </CardContent>
        <CardFooter className="bg-muted/50 p-4 flex items-center justify-between">
          <div className="flex items-center text-xs text-muted-foreground">
            <CalendarIcon className="mr-1 h-3 w-3" />
            <span>
              {project.lastAccessed 
                ? `Zuletzt vor ${formatDistanceToNow(new Date(project.lastAccessed), {
                    locale: de,
                    addSuffix: false,
                  })}`
                : `Erstellt vor ${formatDistanceToNow(new Date(project.createdAt), {
                    locale: de,
                    addSuffix: false,
                  })}`
              }
            </span>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={handleShareProject} className="h-8 w-8">
              <Share2 className="h-4 w-4" />
              <span className="sr-only">Teilen</span>
            </Button>
            {isOwned && (
              <Button variant="ghost" size="icon" onClick={handleDeleteClick} className="h-8 w-8 text-destructive">
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Löschen</span>
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Projekt löschen</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie das Projekt "{project.title}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ProjectCard;
