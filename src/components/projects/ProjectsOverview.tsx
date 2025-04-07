
import { useState, useEffect } from "react";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useProjects } from "@/context/ProjectContext";
import { useUser } from "@/context/UserContext";
import ProjectCard from "./ProjectCard";
import { toast } from "sonner";
import { auth, checkPermission } from "@/lib/firebase";
import { Alert, AlertDescription } from "@/components/ui/alert";

const ProjectsOverview = () => {
  const { projects, addProject, getUserProjects, getSharedProjects } = useProjects();
  const { isAuthenticated, user } = useUser();
  const [newProject, setNewProject] = useState({ title: "", description: "" });
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [permissionError, setPermissionError] = useState(false);
  
  // Check database permissions on component mount
  useEffect(() => {
    const verifyPermissions = async () => {
      if (auth.currentUser) {
        const hasPermission = await checkPermission('projects');
        if (!hasPermission) {
          setPermissionError(true);
          console.warn("User doesn't have permission to access projects");
        } else {
          setPermissionError(false);
        }
      }
    };
    
    verifyPermissions();
  }, [isAuthenticated]);
  
  // Get all user-specific projects
  const myProjects = getUserProjects();
  const sharedProjects = getSharedProjects();
  
  // Combine all projects for the unified view
  const allProjects = [...myProjects, ...sharedProjects];
  
  // Log authentication state for debugging
  useEffect(() => {
    console.log("ProjectsOverview: isAuthenticated =", isAuthenticated);
    console.log("ProjectsOverview: Firebase current user =", auth.currentUser?.email);
  }, [isAuthenticated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!auth.currentUser) {
      toast.error("Du musst angemeldet sein, um ein Projekt zu erstellen");
      return;
    }
    
    if (newProject.title.trim()) {
      try {
        setIsSubmitting(true);
        await addProject(newProject);
        setNewProject({ title: "", description: "" });
        setIsOpen(false);
        toast.success("Projekt erfolgreich erstellt");
      } catch (error) {
        console.error("Error creating project:", error);
        toast.error("Fehler beim Erstellen des Projekts");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projekte</h1>
          <p className="text-muted-foreground mt-1">
            Verwalte deine Interview-Projekte
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-1">
              <PlusCircle className="h-4 w-4" />
              Neues Projekt
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Neues Projekt erstellen</DialogTitle>
                <DialogDescription>
                  Füge ein neues Interview-Projekt zu deiner Sammlung hinzu
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Projekttitel</Label>
                  <Input
                    id="title"
                    placeholder="Projekttitel eingeben"
                    value={newProject.title}
                    onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Beschreibung</Label>
                  <Textarea
                    id="description"
                    placeholder="Beschreibe den Zweck dieses Interview-Projekts"
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
                      Erstelle...
                    </>
                  ) : (
                    "Projekt erstellen"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {permissionError && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>
            Fehler beim Laden der Projekte. Bitte stellen Sie sicher, dass Sie die erforderlichen Berechtigungen haben.
          </AlertDescription>
        </Alert>
      )}

      {isAuthenticated ? (
        <>
          {allProjects.length === 0 && !permissionError ? (
            <div className="flex flex-col items-center justify-center p-12 border border-dashed rounded-lg bg-muted/20 text-center">
              <h3 className="text-lg font-medium">Noch keine Projekte</h3>
              <p className="text-muted-foreground mt-1 mb-4">
                Erstelle dein erstes Projekt, um loszulegen
              </p>
              <Button
                onClick={() => setIsOpen(true)}
                variant="outline"
                className="gap-1"
              >
                <PlusCircle className="h-4 w-4" />
                Projekt erstellen
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allProjects.map((project) => (
                <ProjectCard 
                  key={project.id} 
                  project={project} 
                  isOwned={auth.currentUser?.uid === project.ownerId}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        // Show all projects if not authenticated
        <>
          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 border border-dashed rounded-lg bg-muted/20 text-center">
              <h3 className="text-lg font-medium">Noch keine Projekte</h3>
              <p className="text-muted-foreground mt-1 mb-4">
                Erstelle dein erstes Projekt, um loszulegen
              </p>
              <Button
                onClick={() => setIsOpen(true)}
                variant="outline"
                className="gap-1"
              >
                <PlusCircle className="h-4 w-4" />
                Projekt erstellen
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <ProjectCard 
                  key={project.id} 
                  project={project} 
                  isOwned={false} // Non-authenticated users don't own any projects
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProjectsOverview;
