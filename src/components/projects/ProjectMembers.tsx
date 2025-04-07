
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { useProjects } from "@/context/ProjectContext";
import AddMemberDialog from "./members/AddMemberDialog";
import MembersList from "./members/MembersList";
import { ProjectMember } from "@/types/user";
import { auth } from "@/lib/firebase";
import EmptyMembersList from "./members/EmptyMembersList";

const ProjectMembers = () => {
  const { 
    currentProject,
    getProjectMembers,
    addProjectMember,
    addProjectMemberById,
    removeProjectMember,
    updateProjectMemberRole
  } = useProjects();
  const [isLoading, setIsLoading] = useState(false);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  
  useEffect(() => {
    if (!currentProject) return;
    
    console.log("Loading members for project:", currentProject.id);
    
    // Initial load
    const loadMembers = () => {
      const projectMembers = getProjectMembers(currentProject.id);
      setMembers(projectMembers);
    };
    
    loadMembers();
    
    // Set up interval for periodic updates
    const intervalId = setInterval(loadMembers, 3000);
    
    return () => clearInterval(intervalId);
  }, [currentProject, getProjectMembers]);
  
  if (!currentProject || !auth.currentUser) {
    return null;
  }
  
  const currentUserId = auth.currentUser.uid;
  const isOwner = currentProject.ownerId === currentUserId;
  
  const handleAddMember = async (email: string, role: "editor" | "viewer") => {
    setIsLoading(true);
    try {
      await addProjectMember(currentProject.id, email, role);
      // Refresh member list immediately after adding
      setMembers(getProjectMembers(currentProject.id));
    } catch (error) {
      console.error("Failed to add member:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMemberById = async (userId: string, role: "editor" | "viewer") => {
    setIsLoading(true);
    try {
      await addProjectMemberById(currentProject.id, userId, role);
      // Refresh member list immediately after adding
      setMembers(getProjectMembers(currentProject.id));
    } catch (error) {
      console.error("Failed to add member by ID:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRemoveMember = async (userId: string) => {
    try {
      await removeProjectMember(currentProject.id, userId);
      // Refresh member list immediately after removing
      setMembers(getProjectMembers(currentProject.id));
    } catch (error) {
      console.error("Failed to remove member:", error);
    }
  };
  
  const handleUpdateRole = async (userId: string, newRole: "owner" | "editor" | "viewer") => {
    try {
      await updateProjectMemberRole(currentProject.id, userId, newRole);
      // Refresh member list immediately after updating role
      setMembers(getProjectMembers(currentProject.id));
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
        {members.length === 0 ? (
          <EmptyMembersList isOwner={isOwner} />
        ) : (
          <MembersList
            members={members}
            currentUserId={currentUserId}
            isOwner={isOwner}
            onUpdateRole={handleUpdateRole}
            onRemoveMember={handleRemoveMember}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectMembers;
