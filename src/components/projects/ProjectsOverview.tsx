
import { useState, useEffect } from "react";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProjects } from "@/context/ProjectContext";
import { useAuth } from "@/context/AuthContext";
import { auth, checkPermission } from "@/lib/firebase";
import ProjectsList from "./ProjectsList";
import EmptyProjectsState from "./EmptyProjectsState";
import ProjectCreateDialog from "./ProjectCreateDialog";
import ProjectsPermissionError from "./ProjectsPermissionError";

const ProjectsOverview = () => {
  const { projects, getUserProjects, getSharedProjects } = useProjects();
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [permissionError, setPermissionError] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Check database permissions on component mount
  useEffect(() => {
    const verifyPermissions = async () => {
      setLoading(true);
      if (auth.currentUser) {
        try {
          const hasPermission = await checkPermission('projects');
          setPermissionError(!hasPermission);
          if (!hasPermission) {
            console.warn("User doesn't have permission to access projects");
          }
        } catch (error) {
          console.error("Error checking permissions:", error);
          setPermissionError(true);
        }
      }
      setLoading(false);
    };
    
    verifyPermissions();
  }, [isAuthenticated]);
  
  // Get user's own projects and shared projects
  const userProjects = getUserProjects();
  const sharedProjects = getSharedProjects();
  
  // Log debugging information
  useEffect(() => {
    console.log("ProjectsOverview: All projects count =", projects.length);
    console.log("ProjectsOverview: User projects count =", userProjects.length);
    console.log("ProjectsOverview: Shared projects count =", sharedProjects.length);
    console.log("ProjectsOverview: Projects data =", projects);
  }, [projects, userProjects, sharedProjects]);

  // Log authentication state for debugging
  useEffect(() => {
    console.log("ProjectsOverview: isAuthenticated =", isAuthenticated);
    console.log("ProjectsOverview: Firebase current user =", auth.currentUser?.email);
  }, [isAuthenticated]);

  const allProjects = [...userProjects, ...sharedProjects];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projekte</h1>
          <p className="text-muted-foreground mt-1">
            Verwalte deine Interview-Projekte
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

      {loading && (
        <div className="flex justify-center items-center p-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      )}

      {permissionError && !loading && <ProjectsPermissionError />}

      {!loading && !permissionError && (
        <>
          {allProjects.length === 0 ? (
            <EmptyProjectsState onCreateProject={() => setIsOpen(true)} />
          ) : (
            <ProjectsList projects={allProjects} />
          )}
        </>
      )}
    </div>
  );
};

export default ProjectsOverview;
