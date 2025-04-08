
import PageLayout from "@/components/layout/PageLayout";
import ProjectsOverview from "@/components/projects/ProjectsOverview";
import DatabaseConnectionTest from "@/components/projects/DatabaseConnectionTest";

const Projects = () => {
  return (
    <PageLayout>
      <ProjectsOverview />
      <div className="mt-8">
        <DatabaseConnectionTest />
      </div>
    </PageLayout>
  );
};

export default Projects;
