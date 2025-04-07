
import { Alert, AlertDescription } from "@/components/ui/alert";

const ProjectsPermissionError = () => {
  return (
    <Alert variant="destructive" className="mb-6">
      <AlertDescription>
        Fehler beim Laden der Projekte. Bitte stellen Sie sicher, dass Sie die erforderlichen Berechtigungen haben.
      </AlertDescription>
    </Alert>
  );
};

export default ProjectsPermissionError;
