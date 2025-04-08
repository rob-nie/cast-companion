
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ProjectMember } from "@/context/UserContext";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Edit, Users, UserX } from "lucide-react";

type MemberItemProps = {
  member: ProjectMember;
  currentUserId: string;
  isOwner: boolean;
  onUpdateRole: (userId: string, role: "owner" | "editor" | "viewer") => void;
  onRemoveMember: (userId: string) => void;
};

const MemberItem = ({ 
  member, 
  currentUserId, 
  isOwner, 
  onUpdateRole, 
  onRemoveMember 
}: MemberItemProps) => {
  const getRoleBadgeClass = (role: string) => {
    switch(role) {
      case "owner": return "bg-primary text-primary-foreground";
      case "editor": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
      case "viewer": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100";
    }
  };
  
  const getRoleLabel = (role: string) => {
    switch(role) {
      case "owner": return "Inhaber";
      case "editor": return "Bearbeiter";
      case "viewer": return "Betrachter";
      default: return role;
    }
  };
  
  const getRoleIcon = (role: string) => {
    switch(role) {
      case "owner": return <span className="h-3 w-3">🛡️</span>;
      case "editor": return <Edit className="h-3 w-3" />;
      case "viewer": return null;
      default: return null;
    }
  };

  return (
    <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted/40">
      <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={member.avatar} alt={member.name} />
          <AvatarFallback>
            {member.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium">{member.name}</p>
          <p className="text-xs text-muted-foreground">{member.email}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeClass(member.role)}`}>
          {getRoleIcon(member.role)}
          {getRoleLabel(member.role)}
        </span>
        
        {isOwner && member.userId !== currentUserId && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Users className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Rolle ändern</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onUpdateRole(member.userId, "editor")}>
                <Edit className="mr-2 h-4 w-4" />
                Bearbeiter
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onUpdateRole(member.userId, "viewer")}>
                <Users className="mr-2 h-4 w-4" />
                Betrachter
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-destructive focus:text-destructive"
                onClick={() => onRemoveMember(member.userId)}
              >
                <UserX className="mr-2 h-4 w-4" />
                Entfernen
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
};

export default MemberItem;
