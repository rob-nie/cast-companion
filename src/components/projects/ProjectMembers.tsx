
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useUser } from "@/context/UserContext";
import { useProjects } from "@/context/ProjectContext";
import AddMemberDialog from "./members/AddMemberDialog";
import MembersList from "./members/MembersList";
import { ProjectMember } from "@/context/UserContext";

const ProjectMembers = () => {
  const { currentProject } = useProjects();
  const { user, getProjectMembers, addProjectMember, removeProjectMember, updateProjectMemberRole } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  
  useEffect(() => {
    if (currentProject) {
      // Get initial members
      setMembers(getProjectMembers(currentProject.id));
    }
  }, [currentProject, getProjectMembers]);
  
  if (!currentProject || !user) {
    return null;
  }
  
  const currentUserMember = members.find(m => m.userId === user.id);
  const isOwner = currentUserMember?.role === "owner";
  
  const handleAddMember = async (email: string, role: "editor" | "viewer") => {
    setIsLoading(true);
    try {
      await addProjectMember(currentProject.id, email, role);
      // Update local members list after adding
      setMembers(getProjectMembers(currentProject.id));
    } catch (error) {
      console.error("Failed to add member:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRemoveMember = async (userId: string) => {
    try {
      await removeProjectMember(currentProject.id, userId);
      // Update local members list after removing
      setMembers(getProjectMembers(currentProject.id));
    } catch (error) {
      console.error("Failed to remove member:", error);
    }
  };
  
  const handleUpdateRole = async (userId: string, newRole: "owner" | "editor" | "viewer") => {
    try {
      await updateProjectMemberRole(currentProject.id, userId, newRole);
      // Update local members list after updating role
      setMembers(getProjectMembers(currentProject.id));
    } catch (error) {
      console.error("Failed to update role:", error);
    }
  };
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg font-semibold">Projektmitglieder</CardTitle>
            <CardDescription>
              Verwalte Zugriff und Berechtigungen
            </CardDescription>
          </div>
          {isOwner && (
            <AddMemberDialog onAddMember={handleAddMember} />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <MembersList
          members={members}
          currentUserId={user.id}
          isOwner={isOwner}
          onUpdateRole={handleUpdateRole}
          onRemoveMember={handleRemoveMember}
        />
      </CardContent>
    </Card>
  );
};

export default ProjectMembers;
