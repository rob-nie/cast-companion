
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

type ProjectCreateDialogProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  triggerButton?: React.ReactNode;
};

const ProjectCreateDialog = ({ isOpen, setIsOpen, triggerButton }: ProjectCreateDialogProps) => {
  const { addProject } = useProjects();
  const [newProject, setNewProject] = useState({ title: "", description: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  );
};

export default ProjectCreateDialog;
