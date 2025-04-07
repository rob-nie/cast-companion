
import { CalendarIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";

type ProjectLastAccessedProps = {
  lastAccessed?: Date;
  createdAt: Date;
};

const ProjectLastAccessed = ({ lastAccessed, createdAt }: ProjectLastAccessedProps) => {
  return (
    <div className="flex items-center text-xs text-muted-foreground">
      <CalendarIcon className="mr-1 h-3 w-3" />
      <span>
        {lastAccessed
          ? `Zuletzt vor ${formatDistanceToNow(new Date(lastAccessed), {
              locale: de,
              addSuffix: false,
            })}`
          : `Erstellt vor ${formatDistanceToNow(new Date(createdAt), {
              locale: de,
              addSuffix: false,
            })}`}
      </span>
    </div>
  );
};

export default ProjectLastAccessed;
