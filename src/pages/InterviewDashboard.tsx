
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
      // Update last accessed timestamp
      updateProject(currentProject.id, { lastAccessed: new Date() });
    }
  }, [currentProject, navigate, updateProject]);

  return (
    <PageLayout>
      <Dashboard />
    </PageLayout>
  );
};

export default InterviewDashboard;
