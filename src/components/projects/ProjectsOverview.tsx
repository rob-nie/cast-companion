
import { useState, useEffect } from "react";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProjects } from "@/context/ProjectContext";
import { useAuth } from "@/context/AuthContext";
import { auth, checkPermission, database } from "@/lib/firebase";
import ProjectsList from "./ProjectsList";
import EmptyProjectsState from "./EmptyProjectsState";
import ProjectCreateDialog from "./ProjectCreateDialog";
import ProjectsPermissionError from "./ProjectsPermissionError";
import { ref, get } from "firebase/database";

const ProjectsOverview = () => {
  const { projects, isLoading: projectsLoading } = useProjects();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [permissionError, setPermissionError] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Check database permissions on component mount
  useEffect(() => {
    console.log("==== ProjectsOverview Component Mounted ====");
    console.log("ProjectsOverview: Auth context state:", {
      isAuthenticated,
      authLoading,
      userId: user?.id,
      userEmail: user?.email
    });
    console.log("ProjectsOverview: Firebase auth state:", {
      isAuthenticated: !!auth.currentUser,
      userEmail: auth.currentUser?.email,
      userId: auth.currentUser?.uid
    });

    const verifyPermissions = async () => {
      setLoading(true);
      
      if (auth.currentUser) {
        try {
          console.log("ProjectsOverview: Checking database permissions for 'projects' path");
          const hasPermission = await checkPermission('projects');
          console.log("ProjectsOverview: Permission check result:", hasPermission);
          
          // Additional check - try to get projects directly
          try {
            const projectsRef = ref(database, 'projects');
            console.log("ProjectsOverview: Attempting direct projects read");
            const snapshot = await get(projectsRef);
            console.log("ProjectsOverview: Direct projects read result:", 
              snapshot.exists() ? `Success - found ${Object.keys(snapshot.val()).length} projects` : "No projects found");
          } catch (directError) {
            console.error("ProjectsOverview: Direct projects read error:", directError);
          }
          
          setPermissionError(!hasPermission);
          if (!hasPermission) {
            console.warn("ProjectsOverview: User doesn't have permission to access projects");
          }
        } catch (error) {
          console.error("ProjectsOverview: Error checking permissions:", error);
          setPermissionError(true);
        }
      } else {
        console.log("ProjectsOverview: No authenticated user for permission check");
      }
      
      setLoading(false);
    };
    
    if (!authLoading) {
      verifyPermissions();
    } else {
      console.log("ProjectsOverview: Auth still loading, waiting to verify permissions");
    }
  }, [isAuthenticated, authLoading, user]);
  
  // Log debugging information
  useEffect(() => {
    console.log("ProjectsOverview: State update detected");
    console.log("ProjectsOverview: authLoading =", authLoading);
    console.log("ProjectsOverview: projectsLoading =", projectsLoading);
    console.log("ProjectsOverview: All projects count =", projects.length);
    
    if (projects.length > 0) {
      console.log("ProjectsOverview: Projects available in context:", 
        projects.map(p => ({ id: p.id, title: p.title, ownerId: p.ownerId })));
    } else {
      console.log("ProjectsOverview: No projects in context");
    }
  }, [projects, authLoading, projectsLoading]);

  // Log authentication state for debugging
  useEffect(() => {
    console.log("ProjectsOverview: Authentication state update detected");
    console.log("ProjectsOverview: isAuthenticated =", isAuthenticated);
    console.log("ProjectsOverview: Firebase current user =", auth.currentUser?.email);
    console.log("ProjectsOverview: Firebase user id =", auth.currentUser?.uid);
    console.log("ProjectsOverview: Auth context user =", user?.email);
  }, [isAuthenticated, user]);

  const isPageLoading = loading || authLoading || projectsLoading;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projekte</h1>
          <p className="text-muted-foreground mt-1">
            Alle Projekte im System
          </p>
        </div>
        <Button className="gap-1" onClick={() => setIsOpen(true)}>
          <PlusCircle className="h-4 w-4" />
          Neues Projekt
        </Button>
        <ProjectCreateDialog 
          isOpen={isOpen}
          setIsOpen={setIsOpen}
        />
      </div>

      {isPageLoading && (
        <div className="flex justify-center items-center p-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      )}

      {!isPageLoading && permissionError && <ProjectsPermissionError />}

      {!isPageLoading && !permissionError && (
        <>
          {projects.length === 0 ? (
            <EmptyProjectsState onCreateProject={() => setIsOpen(true)} />
          ) : (
            <ProjectsList projects={projects} />
          )}
        </>
      )}
    </div>
  );
};

export default ProjectsOverview;
