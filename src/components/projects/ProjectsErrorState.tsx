
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface ProjectsErrorStateProps {
  message: string;
  onRetry: () => void;
}

const ProjectsErrorState = ({ message, onRetry }: ProjectsErrorStateProps) => {
  return (
    <div className="mt-4">
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {message}
        </AlertDescription>
      </Alert>
      <div className="flex justify-center mt-4">
        <Button onClick={onRetry} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Erneut versuchen
        </Button>
      </div>
    </div>
  );
};

export default ProjectsErrorState;
