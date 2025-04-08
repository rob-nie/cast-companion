
import PageLayout from "@/components/layout/PageLayout";
import ProjectMembers from "@/components/projects/ProjectMembers";
import { useProjects } from "@/context/ProjectContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

const ProjectSharing = () => {
  const { currentProject } = useProjects();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentProject) {
      navigate("/projects");
    }
  }, [currentProject, navigate]);

  if (!currentProject) return null;

  return (
    <PageLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projekt teilen</h1>
          <p className="text-muted-foreground mt-1">
            Verwalten Sie den Zugriff auf "{currentProject.title}"
          </p>
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
