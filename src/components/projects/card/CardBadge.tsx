
import { FolderHeart, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type CardBadgeProps = {
  isOwned: boolean;
};

const CardBadge = ({ isOwned }: CardBadgeProps) => {
  return (
    <Badge variant={isOwned ? "default" : "secondary"} className="flex items-center gap-1">
      {isOwned ? (
        <>
          <FolderHeart className="h-3 w-3" />
          <span>Eigenes</span>
        </>
      ) : (
        <>
          <Users className="h-3 w-3" />
          <span>Geteilt</span>
        </>
      )}
    </Badge>
  );
};

export default CardBadge;
