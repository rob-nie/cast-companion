
import { useState } from "react";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useProjects } from "@/context/ProjectContext";
import { useUser } from "@/context/UserContext";
import ProjectCard from "./ProjectCard";

const ProjectsOverview = () => {
  const { projects, addProject, getUserProjects, getSharedProjects } = useProjects();
  const { isAuthenticated, user } = useUser();
  const [newProject, setNewProject] = useState({ title: "", description: "" });
  const [isOpen, setIsOpen] = useState(false);
  
  // Get all user-specific projects
  const myProjects = getUserProjects();
  const sharedProjects = getSharedProjects();
  
  // Combine all projects for the unified view
  const allProjects = [...myProjects, ...sharedProjects];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProject.title.trim()) {
      addProject(newProject);
      setNewProject({ title: "", description: "" });
      setIsOpen(false);
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
                <Button type="submit">Projekt erstellen</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isAuthenticated ? (
        <>
          {allProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 border border-dashed rounded-lg bg-muted/20 text-center mt-4">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
              {allProjects.map((project) => (
                <ProjectCard 
                  key={project.id} 
                  project={project} 
                  isOwned={user?.id === project.ownerId}
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
