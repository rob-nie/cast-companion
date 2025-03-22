
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
    <div className="grid gap-6 grid-cols-1 lg:grid-cols-3 lg:grid-rows-[auto_1fr]">
      <div className="lg:col-span-2">
        <InterviewNotesPanel 
          showLiveNotes={showLiveNotes} 
          setShowLiveNotes={setShowLiveNotes} 
        />
      </div>
      
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-1 md:grid-rows-[auto_1fr] lg:row-span-1">
        <WatchTile showLiveNotes={showLiveNotes} />
        <MessengerTile />
      </div>
    </div>
  );
};

export default Dashboard;
