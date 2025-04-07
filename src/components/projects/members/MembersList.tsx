
import { ProjectMember } from "@/types/user";
import MemberItem from "./MemberItem";

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
  // Sort members by role priority (owner first, then alphabetically by name)
  const sortedMembers = [...members].sort((a, b) => {
    if (a.role === "owner" && b.role !== "owner") return -1;
    if (a.role !== "owner" && b.role === "owner") return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="space-y-2">
      {sortedMembers.map((member) => (
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
