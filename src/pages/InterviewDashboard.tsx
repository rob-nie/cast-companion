
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageLayout from "@/components/layout/PageLayout";
import Dashboard from "@/components/dashboard/Dashboard";
import { useProjects } from "@/context/ProjectContext";

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

  return (
    <PageLayout withPadding={false} containerClassName="flex flex-col h-full">
      <Dashboard />
    </PageLayout>
  );
};

export default InterviewDashboard;
