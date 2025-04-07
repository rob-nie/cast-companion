
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageLayout from "@/components/layout/PageLayout";
import Dashboard from "@/components/dashboard/Dashboard";
import { useProjects } from "@/context/ProjectContext";
import { MessagesProvider } from "@/context/MessagesContext"; // Import MessagesProvider

const InterviewDashboard = () => {
  const { currentProject, updateProject } = useProjects();
  const navigate = useNavigate();

  // Redirect if no project is selected
  useEffect(() => {
    if (!currentProject) {
      navigate("/projects");
    } else {
      // Update last accessed timestamp without triggering a toast notification
      updateProject(currentProject.id, { lastAccessed: new Date() }, true);
    }
  }, [currentProject, navigate, updateProject]);

  // Only render Dashboard if we have a current project
  if (!currentProject) {
    return null;
  }

  return (
    <PageLayout withPadding={false}>
      {/* Wrap Dashboard with MessagesProvider */}
      <Dashboard />
    </PageLayout>
  );
};

export default InterviewDashboard;
