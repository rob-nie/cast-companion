
import { useState, useEffect } from "react";
import { useProjects } from "@/context/ProjectContext";
import { useNavigate } from "react-router-dom";
import InterviewNotesPanel from "./InterviewNotesPanel";
import MessengerTile from "./MessengerTile";
import WatchTile from "./WatchTile";

const Dashboard = () => {
  const { currentProject } = useProjects();
  const navigate = useNavigate();
  const [showLiveNotes, setShowLiveNotes] = useState(false);

  // Redirect if no project is selected
  useEffect(() => {
    if (!currentProject) {
      navigate("/projects");
    }
  }, [currentProject, navigate]);

  // Don't render anything if there's no current project
  if (!currentProject) {
    return null;
  }

  return (
    <div className="grid gap-6 grid-cols-1 lg:grid-cols-3 h-[calc(100vh-5rem)] overflow-hidden">
      <div className="lg:col-span-2 h-full">
        <InterviewNotesPanel 
          showLiveNotes={showLiveNotes} 
          setShowLiveNotes={setShowLiveNotes} 
        />
      </div>
      
      <div className="flex flex-col gap-6 h-full">
        <div className="flex-shrink-0">
          <WatchTile showLiveNotes={showLiveNotes} />
        </div>
        <div className="flex-1 overflow-hidden">
          <MessengerTile />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
