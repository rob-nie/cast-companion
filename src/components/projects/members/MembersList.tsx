
import { ProjectMember } from "@/context/UserContext";
import MemberItem from "./MemberItem";
import EmptyMembersList from "./EmptyMembersList";

type MembersListProps = {
  members: ProjectMember[];
  currentUserId: string;
  isOwner: boolean;
  onUpdateRole: (userId: string, role: "owner" | "editor" | "viewer") => void;
  onRemoveMember: (userId: string) => void;
};

const MembersList = ({ 
  members, 
  currentUserId, 
  isOwner, 
  onUpdateRole, 
  onRemoveMember 
}: MembersListProps) => {
  if (members.length === 0) {
    return <EmptyMembersList />;
  }

  return (
    <div className="space-y-3">
      {members.map((member) => (
        <MemberItem
          key={member.userId}
          member={member}
          currentUserId={currentUserId}
          isOwner={isOwner}
          onUpdateRole={onUpdateRole}
          onRemoveMember={onRemoveMember}
        />
      ))}
    </div>
  );
};

export default MembersList;
