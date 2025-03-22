
import { useState } from "react";
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
  if (!currentProject) {
    navigate("/projects");
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
        <WatchTile showLiveNotes={showLiveNotes} />
        <div className="flex-1">
          <MessengerTile />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
