
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageLayout from "@/components/layout/PageLayout";
import Dashboard from "@/components/dashboard/Dashboard";
import { useProjects } from "@/context/ProjectContext";
import { MessagesProvider } from "@/context/MessagesContext";
import { toast } from "sonner";

const InterviewDashboard = () => {
  const { currentProject, updateProject, projects } = useProjects();
  const navigate = useNavigate();

  // Redirect if no project is selected
  useEffect(() => {
    if (!currentProject) {
      navigate("/projects");
    } else {
      // Check if current user still has access to this project
      const projectExists = projects.some(p => p.id === currentProject.id);
      if (!projectExists) {
        toast.error("Du hast keinen Zugriff mehr auf dieses Projekt.");
        navigate("/projects");
        return;
      }
      
      // Update last accessed timestamp without triggering a toast notification
      updateProject(currentProject.id, { lastAccessed: new Date() }, true);
    }
  }, [currentProject, navigate, updateProject, projects]);

  // Only render Dashboard if we have a current project
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
