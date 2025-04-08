
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { useUser } from "@/context/UserContext";
import { useProjects } from "@/context/ProjectContext";
import AddMemberDialog from "./members/AddMemberDialog";
import MembersList from "./members/MembersList";
import { ProjectMember } from "@/types/user";

const ProjectMembers = () => {
  const { currentProject, shareProject, shareProjectByUserId, revokeAccess, changeRole, getProjectMembers } = useProjects();
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  
  useEffect(() => {
    let isMounted = true;
    
    const loadMembers = async () => {
      if (currentProject) {
        setIsLoading(true);
        try {
          // Get the members from the current project
          const projectMembers = await getProjectMembers(currentProject.id);
          if (isMounted) {
            setMembers(projectMembers);
          }
        } catch (error) {
          console.error("Failed to load members:", error);
        } finally {
          if (isMounted) {
            setIsLoading(false);
          }
        }
      }
    };
    
    loadMembers();
    
    return () => {
      isMounted = false;
    };
  }, [currentProject, getProjectMembers]);
  
  if (!currentProject || !user) {
    return null;
  }
  
  const currentUserMember = members.find(m => m.userId === user.id);
  const isOwner = currentUserMember?.role === "owner";
  
  const handleAddMember = async (email: string, role: "editor" | "viewer") => {
    setIsLoading(true);
    try {
      await shareProject(currentProject.id, email, role);
      // Members list will be updated via Firebase realtime updates
    } catch (error) {
      console.error("Failed to add member:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAddMemberById = async (userId: string, role: "editor" | "viewer") => {
    setIsLoading(true);
    try {
      await shareProjectByUserId(currentProject.id, userId, role);
      // Members list will be updated via Firebase realtime updates
    } catch (error) {
      console.error("Failed to add member by ID:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRemoveMember = async (userId: string) => {
    try {
      await revokeAccess(currentProject.id, userId);
      // Members list will be updated via Firebase realtime updates
    } catch (error) {
      console.error("Failed to remove member:", error);
    }
  };
  
  const handleUpdateRole = async (userId: string, newRole: "owner" | "editor" | "viewer") => {
    try {
      await changeRole(currentProject.id, userId, newRole);
      // Members list will be updated via Firebase realtime updates
    } catch (error) {
      console.error("Failed to update role:", error);
    }
  };
  
  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="flex justify-between items-center w-full">
          <div>
            <p className="text-muted-foreground text-sm">
              Verwalte Zugriff und Berechtigungen
            </p>
          </div>
          {isOwner && (
            <AddMemberDialog 
              onAddMember={handleAddMember} 
              onAddMemberById={handleAddMemberById}
            />
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
