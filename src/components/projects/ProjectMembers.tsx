
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
import { LoaderCircle, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

const ProjectMembers = () => {
  const { currentProject, shareProject, shareProjectByUserId, revokeAccess, changeRole, getProjectMembers } = useProjects();
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  
  useEffect(() => {
    let isMounted = true;
    
    const loadMembers = async () => {
      if (currentProject) {
        setIsLoading(true);
        setError(null);
        try {
          // Get the members from the current project
          const projectMembers = await getProjectMembers(currentProject.id);
          if (isMounted) {
            setMembers(projectMembers);
          }
        } catch (error) {
          console.error("Failed to load members:", error);
          if (isMounted) {
            setError("Mitglieder konnten nicht geladen werden.");
          }
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
  const isOwner = currentProject.ownerId === user.id;
  
  const handleAddMember = async (email: string, role: "editor" | "viewer") => {
    setIsLoading(true);
    try {
      await shareProject(currentProject.id, email, role);
      // Members list will be updated via the next loadMembers call
      const updatedMembers = await getProjectMembers(currentProject.id);
      setMembers(updatedMembers);
    } catch (error) {
      console.error("Failed to add member:", error);
      setError("Mitglied konnte nicht hinzugefügt werden.");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAddMemberById = async (userId: string, role: "editor" | "viewer") => {
    setIsLoading(true);
    try {
      await shareProjectByUserId(currentProject.id, userId, role);
      // Members list will be updated via the next loadMembers call
      const updatedMembers = await getProjectMembers(currentProject.id);
      setMembers(updatedMembers);
    } catch (error) {
      console.error("Failed to add member by ID:", error);
      setError("Mitglied konnte nicht hinzugefügt werden.");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRemoveMember = async (userId: string) => {
    setIsLoading(true);
    try {
      await revokeAccess(currentProject.id, userId);
      // Update the local state without requiring a new API call
      setMembers(members.filter(m => m.userId !== userId));
    } catch (error) {
      console.error("Failed to remove member:", error);
      setError("Mitglied konnte nicht entfernt werden.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleUpdateRole = async (userId: string, newRole: "owner" | "editor" | "viewer") => {
    setIsLoading(true);
    try {
      await changeRole(currentProject.id, userId, newRole);
      // Update the local state without requiring a new API call
      setMembers(members.map(m => 
        m.userId === userId ? { ...m, role: newRole } : m
      ));
    } catch (error) {
      console.error("Failed to update role:", error);
      setError("Rolle konnte nicht aktualisiert werden.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetryLoadMembers = async () => {
    if (currentProject) {
      setIsLoading(true);
      setError(null);
      try {
        const projectMembers = await getProjectMembers(currentProject.id);
        setMembers(projectMembers);
      } catch (error) {
        console.error("Failed to reload members:", error);
        setError("Mitglieder konnten nicht geladen werden.");
      } finally {
        setIsLoading(false);
      }
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
          {isOwner && !isLoading && (
            <AddMemberDialog 
              onAddMember={handleAddMember} 
              onAddMemberById={handleAddMemberById}
            />
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-8">
            <LoaderCircle className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Mitglieder werden geladen...</p>
          </div>
        ) : error ? (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="flex justify-center">
              <Button onClick={handleRetryLoadMembers} variant="outline" size="sm">
                Erneut versuchen
              </Button>
            </div>
          </div>
        ) : (
          <MembersList
            members={members}
            currentUserId={user.id}
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
