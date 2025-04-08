
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProjectsEmptyStateProps {
  message: string;
  description?: string;
  searchTerm?: string;
  onCreateClick?: () => void;
}

const ProjectsEmptyState = ({ 
  message, 
  description = "Erstelle dein erstes Projekt, um loszulegen", 
  searchTerm,
  onCreateClick
}: ProjectsEmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 border border-dashed rounded-lg bg-muted/20 text-center mt-4">
      <h3 className="text-lg font-medium">{message}</h3>
      <p className="text-muted-foreground mt-1 mb-4">
        {searchTerm ? `Es wurden keine Projekte gefunden, die "${searchTerm}" enthalten` : description}
      </p>
      {onCreateClick && (
        <Button
          onClick={onCreateClick}
          variant="outline"
          className="gap-1"
        >
          <PlusCircle className="h-4 w-4" />
          Projekt erstellen
        </Button>
      )}
    </div>
  );
};

export default ProjectsEmptyState;
