
import PageLayout from "@/components/layout/PageLayout";
import ProjectMembers from "@/components/projects/ProjectMembers";
import { useProjects } from "@/context/ProjectContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import AddMemberDialog from "@/components/projects/members/AddMemberDialog";
import { auth } from "@/lib/firebase";

const ProjectSharing = () => {
  const { currentProject, shareProject } = useProjects();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentProject) {
      navigate("/projects");
    }
  }, [currentProject, navigate]);

  if (!currentProject) return null;
  
  const isOwner = currentProject.ownerId === auth.currentUser?.uid;

  return (
    <PageLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Projekt teilen</h1>
            <p className="text-muted-foreground mt-1">
              Verwalten Sie den Zugriff auf "{currentProject.title}"
            </p>
          </div>
          {isOwner && (
            <AddMemberDialog 
              onAddMember={async (email, role) => {
                try {
                  // Verwende die bereits vorhandene Funktion zum Hinzufügen von Benutzern
                  await shareProject(currentProject.id, email, role);
                } catch (error) {
                  console.error("Fehler beim Hinzufügen eines Mitglieds:", error);
                }
              }}
              onAddMemberById={async (userId, role) => {
                try {
                  // Verwende die Funktion zum Hinzufügen von Benutzern per ID
                  await useProjects().addProjectMemberById(currentProject.id, userId, role);
                } catch (error) {
                  console.error("Fehler beim Hinzufügen eines Mitglieds per ID:", error);
                }
              }}
            >
              <Button className="gap-2">
                <UserPlus className="h-4 w-4" />
                Benutzer hinzufügen
              </Button>
            </AddMemberDialog>
          )}
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Berechtigungen</AlertTitle>
          <AlertDescription>
            Bearbeiter können Inhalte ändern, während Betrachter nur lesen dürfen. Nur der Projektinhaber kann Berechtigungen verwalten.
          </AlertDescription>
        </Alert>
        
        <ProjectMembers />
      </div>
    </PageLayout>
  );
};

export default ProjectSharing;
