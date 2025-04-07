
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

type EmptyProjectsStateProps = {
  onCreateProject: () => void;
};

const EmptyProjectsState = ({ onCreateProject }: EmptyProjectsStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 border border-dashed rounded-lg bg-muted/20 text-center">
      <h3 className="text-lg font-medium">Noch keine Projekte</h3>
      <p className="text-muted-foreground mt-1 mb-4">
        Erstelle dein erstes Projekt, um loszulegen
      </p>
      <Button
        onClick={onCreateProject}
        variant="outline"
        className="gap-1"
      >
        <PlusCircle className="h-4 w-4" />
        Projekt erstellen
      </Button>
    </div>
  );
};

export default EmptyProjectsState;
