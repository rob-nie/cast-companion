
import { Users } from "lucide-react";

const EmptyMembersList = () => {
  return (
    <div className="text-center p-6 border border-dashed rounded-md">
      <Users className="h-10 w-10 mx-auto text-muted-foreground/60" />
      <p className="mt-2 text-muted-foreground">
        Dieses Projekt hat noch keine Mitglieder
      </p>
    </div>
  );
};

export default EmptyMembersList;
