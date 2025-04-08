
import { useState, useEffect } from "react";
import { PlusCircle, LoaderCircle, Search, RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useProjects } from "@/context/ProjectContext";
import { useUser } from "@/context/UserContext";
import ProjectCard from "./ProjectCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Project } from "@/context/projectManagement";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

const ProjectsOverview = () => {
  const { getUserProjects, getSharedProjects, addProject, isLoading } = useProjects();
  const { isAuthenticated, user } = useUser();
  const [newProject, setNewProject] = useState({ title: "", description: "" });
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredProjects, setFilteredProjects] = useState<{
    myProjects: Project[],
    sharedProjects: Project[],
  }>({
    myProjects: [],
    sharedProjects: []
  });
  const [retryCount, setRetryCount] = useState(0);
  
  // Get user-specific projects
  const myProjects = getUserProjects();
  const sharedProjects = getSharedProjects();
  
  // Filter projects when search term or projects change
  useEffect(() => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      setFilteredProjects({
        myProjects: myProjects.filter(
          project => project.title.toLowerCase().includes(term) || 
                     project.description?.toLowerCase().includes(term)
        ),
        sharedProjects: sharedProjects.filter(
          project => project.title.toLowerCase().includes(term) || 
                     project.description?.toLowerCase().includes(term)
        )
      });
    } else {
      setFilteredProjects({
        myProjects,
        sharedProjects
      });
    }
  }, [searchTerm, myProjects, sharedProjects]);

  // Log the number of projects loaded for debugging
  useEffect(() => {
    console.log(`ProjectsOverview: Loaded ${myProjects.length} owned projects and ${sharedProjects.length} shared projects`);
  }, [myProjects, sharedProjects]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProject.title.trim()) {
      addProject(newProject);
      setNewProject({ title: "", description: "" });
      setIsOpen(false);
    }
  };

  const handleRetryLoading = () => {
    setRetryCount(prev => prev + 1);
    toast.info("Reloading projects...");
    // The effect will re-run because we're changing the key on useProjects below
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
      <p className="text-muted-foreground mt-1 mb-4">
        Bitte warten Sie einen Moment...
      </p>
      {retryCount > 0 && (
        <p className="text-xs text-muted-foreground">Versuch {retryCount+1}...</p>
      )}
    </div>
  );

  const renderErrorState = (message: string) => (
    <div className="mt-4">
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {message}
        </AlertDescription>
      </Alert>
      <div className="flex justify-center mt-4">
        <Button onClick={handleRetryLoading} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Erneut versuchen
        </Button>
      </div>
    </div>
  );

  const renderProjectGrid = (projects: Project[]) => (
    <>
      {projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
          {projects.map((project) => (
            <ProjectCard 
              key={project.id} 
              project={project} 
              isOwned={user?.id === project.ownerId}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 border border-dashed rounded-lg bg-muted/20 text-center mt-4">
          <h3 className="text-lg font-medium">Keine Projekte gefunden</h3>
          {searchTerm ? (
            <p className="text-muted-foreground mt-1">
              Keine Projekte entsprechen deiner Suche
            </p>
          ) : (
            <p className="text-muted-foreground mt-1">
              Es gibt noch keine Projekte in dieser Kategorie
            </p>
          )}
        </div>
      )}
    </>
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
        <div>
          <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Projekte durchsuchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            {isLoading && (
              <Button variant="outline" disabled className="whitespace-nowrap">
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Lädt...
              </Button>
            )}
            {!isLoading && (
              <Button variant="outline" onClick={handleRetryLoading} className="whitespace-nowrap">
                <RefreshCw className="h-4 w-4 mr-2" />
                Aktualisieren
              </Button>
            )}
          </div>
          
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="all">Alle Projekte</TabsTrigger>
              <TabsTrigger value="my">Meine Projekte</TabsTrigger>
              <TabsTrigger value="shared">Geteilte Projekte</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all">
              {isLoading ? (
                renderLoadingState()
              ) : filteredProjects.myProjects.length === 0 && filteredProjects.sharedProjects.length === 0 ? (
                searchTerm ? (
                  <div className="flex flex-col items-center justify-center p-12 border border-dashed rounded-lg bg-muted/20 text-center mt-4">
                    <h3 className="text-lg font-medium">Keine Ergebnisse</h3>
                    <p className="text-muted-foreground mt-1">
                      Es wurden keine Projekte gefunden, die "{searchTerm}" enthalten
                    </p>
                  </div>
                ) : (
                  renderEmptyState("Noch keine Projekte")
                )
              ) : (
                renderProjectGrid([...filteredProjects.myProjects, ...filteredProjects.sharedProjects])
              )}
            </TabsContent>
            
            <TabsContent value="my">
              {isLoading ? (
                renderLoadingState()
              ) : filteredProjects.myProjects.length === 0 ? (
                searchTerm ? (
                  <div className="flex flex-col items-center justify-center p-12 border border-dashed rounded-lg bg-muted/20 text-center mt-4">
                    <h3 className="text-lg font-medium">Keine Ergebnisse</h3>
                    <p className="text-muted-foreground mt-1">
                      Es wurden keine eigenen Projekte gefunden, die "{searchTerm}" enthalten
                    </p>
                  </div>
                ) : (
                  renderEmptyState("Noch keine eigenen Projekte")
                )
              ) : (
                renderProjectGrid(filteredProjects.myProjects)
              )}
            </TabsContent>
            
            <TabsContent value="shared">
              {isLoading ? (
                renderLoadingState()
              ) : filteredProjects.sharedProjects.length === 0 ? (
                searchTerm ? (
                  <div className="flex flex-col items-center justify-center p-12 border border-dashed rounded-lg bg-muted/20 text-center mt-4">
                    <h3 className="text-lg font-medium">Keine Ergebnisse</h3>
                    <p className="text-muted-foreground mt-1">
                      Es wurden keine geteilten Projekte gefunden, die "{searchTerm}" enthalten
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-12 border border-dashed rounded-lg bg-muted/20 text-center mt-4">
                    <h3 className="text-lg font-medium">Keine geteilten Projekte</h3>
                    <p className="text-muted-foreground mt-1">
                      Noch hat niemand ein Projekt mit dir geteilt
                    </p>
                  </div>
                )
              ) : (
                renderProjectGrid(filteredProjects.sharedProjects)
              )}
            </TabsContent>
          </Tabs>
        </div>
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
