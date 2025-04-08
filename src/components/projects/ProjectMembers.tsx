
import { useState, useEffect, useCallback } from "react";
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
import { LoaderCircle, AlertTriangle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const ProjectMembers = () => {
  const { currentProject } = useProjects();
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  
  // Get these functions from the context
  const { getProjectMembers, addProjectMember, addProjectMemberByUserId, removeProjectMember, updateProjectMemberRole } = useProjects();
  
  const loadMembers = useCallback(async () => {
    if (!currentProject || !currentProject.id) {
      setMembers([]);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const projectMembers = await getProjectMembers(currentProject.id);
      setMembers(projectMembers);
    } catch (error) {
      console.error("Fehler beim Laden der Mitglieder:", error);
      setError("Mitglieder konnten nicht geladen werden");
      toast.error("Fehler beim Laden der Projektmitglieder");
    } finally {
      setIsLoading(false);
    }
  }, [currentProject, getProjectMembers]);
  
  useEffect(() => {
    if (currentProject?.id) {
      loadMembers();
    }
  }, [currentProject?.id, loadMembers]);
  
  if (!currentProject || !user) {
    return null;
  }
  
  const isOwner = currentProject.ownerId === user.id;
  
  const handleAddMember = async (email: string, role: "editor" | "viewer") => {
    setIsLoading(true);
    try {
      await addProjectMember(currentProject.id, email, role);
      loadMembers(); // Reload the members list
      toast.success("Mitglied erfolgreich hinzugefügt");
    } catch (error) {
      console.error("Fehler beim Hinzufügen des Mitglieds:", error);
      setError("Mitglied konnte nicht hinzugefügt werden");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAddMemberById = async (userId: string, role: "editor" | "viewer") => {
    setIsLoading(true);
    try {
      await addProjectMemberByUserId(currentProject.id, userId, role);
      loadMembers(); // Reload the members list
      toast.success("Mitglied erfolgreich hinzugefügt");
    } catch (error) {
      console.error("Fehler beim Hinzufügen des Mitglieds über ID:", error);
      setError("Mitglied konnte nicht hinzugefügt werden");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRemoveMember = async (userId: string) => {
    setIsLoading(true);
    try {
      await removeProjectMember(currentProject.id, userId);
      // Update the local state without requiring a new API call
      setMembers(prev => prev.filter(m => m.userId !== userId));
      toast.success("Mitglied erfolgreich entfernt");
    } catch (error) {
      console.error("Fehler beim Entfernen des Mitglieds:", error);
      setError("Mitglied konnte nicht entfernt werden");
      loadMembers(); // Reload to ensure consistency
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleUpdateRole = async (userId: string, newRole: "owner" | "editor" | "viewer") => {
    setIsLoading(true);
    try {
      await updateProjectMemberRole(currentProject.id, userId, newRole);
      // Update the local state without requiring a new API call
      setMembers(prev => 
        prev.map(m => m.userId === userId ? { ...m, role: newRole } : m)
      );
      toast.success("Rolle erfolgreich aktualisiert");
    } catch (error) {
      console.error("Fehler beim Aktualisieren der Rolle:", error);
      setError("Rolle konnte nicht aktualisiert werden");
      loadMembers(); // Reload to ensure consistency
    } finally {
      setIsLoading(false);
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
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadMembers}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Aktualisieren
            </Button>
            
            {isOwner && (
              <AddMemberDialog 
                onAddMember={handleAddMember} 
                onAddMemberById={handleAddMemberById}
              />
            )}
          </div>
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
              <Button onClick={loadMembers} variant="outline" size="sm">
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
