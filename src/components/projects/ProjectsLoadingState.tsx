
import { LoaderCircle } from "lucide-react";

interface ProjectsLoadingStateProps {
  retryCount?: number;
}

const ProjectsLoadingState = ({ retryCount = 0 }: ProjectsLoadingStateProps) => {
  return (
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
};

export default ProjectsLoadingState;
