
import { useState } from "react";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useProjects } from "@/context/ProjectContext";
import { auth } from "@/lib/firebase";
import { useNavigate } from "react-router-dom";

type ProjectCreateDialogProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  triggerButton?: React.ReactNode;
};

const ProjectCreateDialog = ({ isOpen, setIsOpen, triggerButton }: ProjectCreateDialogProps) => {
  const { addProject, projects, setCurrentProject } = useProjects();
  const [newProject, setNewProject] = useState({ title: "", description: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!auth.currentUser) {
      toast.error("Du musst angemeldet sein, um ein Projekt zu erstellen");
      return;
    }
    
    if (newProject.title.trim()) {
      try {
        setIsSubmitting(true);
        console.log("Creating new project with title:", newProject.title);
        
        // Create the project
        const newProjectId = await addProject(newProject);
        
        // Find the newly created project based on ID
        // Wait a bit longer for the projects to update with the new project
        setTimeout(() => {
          // Try to find the project by ID first if addProject returned an ID
          let createdProject = newProjectId ? 
            projects.find(p => p.id === newProjectId) : 
            // Fallback to finding by title and owner
            projects.find(p => 
              p.title === newProject.title && 
              p.ownerId === auth.currentUser?.uid
            );
          
          if (createdProject) {
            console.log("Setting current project after creation:", createdProject.id);
            // Set current project in context
            setCurrentProject(createdProject);
            
            // Also store in localStorage
            localStorage.setItem('currentProject', JSON.stringify(createdProject));
            
            // Reset form and close dialog
            setNewProject({ title: "", description: "" });
            setIsOpen(false);
            
            // Show success message
            toast.success("Projekt erfolgreich erstellt");
            
            // Navigate to dashboard after a short delay
            setTimeout(() => {
              navigate("/dashboard");
            }, 300);
          } else {
            console.error("Could not find created project");
            toast.error("Projekt wurde erstellt, konnte aber nicht geöffnet werden");
            setIsOpen(false);
            setNewProject({ title: "", description: "" });
            setIsSubmitting(false);
          }
        }, 800); // Wait longer for project to be available in the projects array
      } catch (error) {
        console.error("Error creating project:", error);
        toast.error("Fehler beim Erstellen des Projekts");
        setIsSubmitting(false);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {triggerButton && <DialogTrigger asChild>{triggerButton}</DialogTrigger>}
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
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-4 border-t-transparent" />
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
  );
};

export default ProjectCreateDialog;
