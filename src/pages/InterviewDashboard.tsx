
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageLayout from "@/components/layout/PageLayout";
import Dashboard from "@/components/dashboard/Dashboard";
import { useProjects } from "@/context/ProjectContext";
import { MessagesProvider } from "@/context/MessagesContext";
import { toast } from "sonner";
import { Project } from "@/context/projectManagement";

const InterviewDashboard = () => {
  const { currentProject, setCurrentProject, updateProject, projects } = useProjects();
  const [isLoading, setIsLoading] = useState(true);
  const [projectLoaded, setProjectLoaded] = useState(false);
  const navigate = useNavigate();

  // Load current project from context or localStorage if missing
  useEffect(() => {
    console.log("Dashboard: Initializing with currentProject:", currentProject?.id);
    
    // Reset loading state if project already exists in context
    if (currentProject && !projectLoaded) {
      console.log("Dashboard: Project already in context:", currentProject.id);
      setIsLoading(false);
      setProjectLoaded(true);
      return;
    }
    
    // Skip if we've already loaded a project or if we're still waiting for projects to load
    if (projectLoaded || projects.length === 0) {
      return;
    }
    
    const loadProject = async () => {
      // If no current project in context, try to load from localStorage
      if (!currentProject) {
        console.log("Dashboard: No current project in context, checking localStorage");
        try {
          const savedProject = localStorage.getItem('currentProject');
          if (savedProject) {
            const parsedProject = JSON.parse(savedProject) as Project;
            console.log("Dashboard: Found project in localStorage:", parsedProject.id);
            
            // Verify the project exists in the user's projects
            const projectExists = projects.some(p => p.id === parsedProject.id);
            if (projectExists) {
              console.log("Dashboard: Project exists in user projects, setting as current");
              setCurrentProject(parsedProject);
              setProjectLoaded(true);
              setIsLoading(false);
            } else {
              console.log("Dashboard: Project doesn't exist in user projects, redirecting");
              toast.error("Dieses Projekt ist nicht mehr verfügbar.");
              localStorage.removeItem('currentProject');
              navigate("/projects");
            }
          } else {
            console.log("Dashboard: No project in localStorage, redirecting");
            navigate("/projects");
            setIsLoading(false);
          }
        } catch (error) {
          console.error("Error loading project from localStorage:", error);
          navigate("/projects");
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
        setProjectLoaded(true);
      }
    };
    
    loadProject();
  }, [currentProject, navigate, setCurrentProject, projects, projectLoaded]);

  // On project change, ensure it still exists in user's projects
  useEffect(() => {
    if (!isLoading && currentProject && projectLoaded) {
      console.log("Dashboard: Verifying currentProject access:", currentProject.id);
      
      // Check if current user still has access to this project
      const projectExists = projects.some(p => p.id === currentProject.id);
      if (!projectExists && projects.length > 0) {
        console.log("Dashboard: User lost access to project:", currentProject.id);
        toast.error("Du hast keinen Zugriff mehr auf dieses Projekt.");
        localStorage.removeItem('currentProject');
        navigate("/projects");
        return;
      }
      
      if (projectExists) {
        // Update last accessed timestamp without triggering a toast notification
        console.log("Dashboard: Updating last accessed timestamp");
        updateProject(currentProject.id, { lastAccessed: new Date() }, true);
      }
    }
  }, [currentProject, navigate, updateProject, projects, isLoading, projectLoaded]);

  // Only render Dashboard if we have loaded everything and have a project
  if (isLoading) {
    return (
      <PageLayout withPadding={false}>
        <div className="flex items-center justify-center h-full">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </PageLayout>
    );
  }

  // Don't render without a current project
  if (!currentProject) {
    return null;
  }

  return (
    <PageLayout withPadding={false}>
      <MessagesProvider>
        <Dashboard />
      </MessagesProvider>
    </PageLayout>
  );
};

export default InterviewDashboard;
