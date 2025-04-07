
import { UsersX } from "lucide-react";

type EmptyMembersListProps = {
  isOwner: boolean;
}

const EmptyMembersList = ({ isOwner }: EmptyMembersListProps) => {
  return (
    <div className="text-center py-8">
      <UsersX className="mx-auto h-12 w-12 text-muted-foreground" />
      <h3 className="mt-4 text-lg font-semibold">Keine Mitglieder gefunden</h3>
      {isOwner ? (
        <p className="mt-2 text-muted-foreground max-w-xs mx-auto">
          Klicken Sie auf "Einladen", um Mitglieder zu diesem Projekt hinzuzufügen.
        </p>
      ) : (
        <p className="mt-2 text-muted-foreground max-w-xs mx-auto">
          Dieses Projekt wurde mit Ihnen geteilt, aber es gibt keine weiteren Mitglieder.
        </p>
      )}
    </div>
  );
};

export default EmptyMembersList;
