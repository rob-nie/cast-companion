
import { useState } from "react";
import { PlusCircle, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useProjects } from "@/context/ProjectContext";
import { useUser } from "@/context/UserContext";
import ProjectCard from "./ProjectCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ProjectsOverview = () => {
  const { getUserProjects, getSharedProjects, addProject, isLoading } = useProjects();
  const { isAuthenticated, user } = useUser();
  const [newProject, setNewProject] = useState({ title: "", description: "" });
  const [isOpen, setIsOpen] = useState(false);
  
  // Get user-specific projects
  const myProjects = getUserProjects();
  const sharedProjects = getSharedProjects();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProject.title.trim()) {
      addProject(newProject);
      setNewProject({ title: "", description: "" });
      setIsOpen(false);
    }
  };

  const renderEmptyState = (message: string) => (
    <div className="flex flex-col items-center justify-center p-12 border border-dashed rounded-lg bg-muted/20 text-center mt-4">
      <h3 className="text-lg font-medium">{message}</h3>
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
  );

  const renderLoadingState = () => (
    <div className="flex flex-col items-center justify-center p-12 border border-dashed rounded-lg bg-muted/20 text-center mt-4">
      <LoaderCircle className="h-10 w-10 animate-spin text-muted-foreground mb-2" />
      <h3 className="text-lg font-medium">Projekte werden geladen</h3>
      <p className="text-muted-foreground mt-1">
        Bitte warten Sie einen Moment...
      </p>
    </div>
  );

  const renderProjectGrid = (projects: any[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
      {projects.map((project) => (
        <ProjectCard 
          key={project.id} 
          project={project} 
          isOwned={user?.id === project.ownerId}
        />
      ))}
    </div>
  );

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
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="all">Alle Projekte</TabsTrigger>
            <TabsTrigger value="my">Meine Projekte</TabsTrigger>
            <TabsTrigger value="shared">Geteilte Projekte</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            {isLoading ? (
              renderLoadingState()
            ) : myProjects.length === 0 && sharedProjects.length === 0 ? (
              renderEmptyState("Noch keine Projekte")
            ) : (
              renderProjectGrid([...myProjects, ...sharedProjects])
            )}
          </TabsContent>
          
          <TabsContent value="my">
            {isLoading ? (
              renderLoadingState()
            ) : myProjects.length === 0 ? (
              renderEmptyState("Noch keine eigenen Projekte")
            ) : (
              renderProjectGrid(myProjects)
            )}
          </TabsContent>
          
          <TabsContent value="shared">
            {isLoading ? (
              renderLoadingState()
            ) : sharedProjects.length === 0 ? (
              renderEmptyState("Keine geteilten Projekte")
            ) : (
              renderProjectGrid(sharedProjects)
            )}
          </TabsContent>
        </Tabs>
      ) : (
        // Show a message for non-authenticated users
        <div className="flex flex-col items-center justify-center p-12 border border-dashed rounded-lg bg-muted/20 text-center">
          <h3 className="text-lg font-medium">Bitte melde dich an</h3>
          <p className="text-muted-foreground mt-1 mb-4">
            Um deine Projekte zu sehen, musst du dich anmelden
          </p>
        </div>
      )}
    </div>
  );
};

export default ProjectsOverview;
