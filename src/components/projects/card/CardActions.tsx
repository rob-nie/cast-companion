
import { Share2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type CardActionsProps = {
  isOwned: boolean;
  onShare: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
};

const CardActions = ({ isOwned, onShare, onDelete }: CardActionsProps) => {
  return (
    <div className="flex gap-1">
      <Button variant="ghost" size="icon" onClick={onShare} className="h-8 w-8">
        <Share2 className="h-4 w-4" />
        <span className="sr-only">Teilen</span>
      </Button>
      {isOwned && (
        <Button variant="ghost" size="icon" onClick={onDelete} className="h-8 w-8 text-destructive">
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Löschen</span>
        </Button>
      )}
    </div>
  );
};

export default CardActions;
