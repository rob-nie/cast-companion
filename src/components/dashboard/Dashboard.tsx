
import { useState, useEffect } from "react";
import { useProjects } from "@/context/ProjectContext";
import { useNavigate } from "react-router-dom";
import InterviewNotesPanel from "./InterviewNotesPanel";
import MessengerTile from "./MessengerTile";
import WatchTile from "./WatchTile";
import { toast } from "sonner";

const Dashboard = () => {
  const { currentProject, updateProject } = useProjects();
  const navigate = useNavigate();
  const [showLiveNotes, setShowLiveNotes] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Wenn kein Projekt ausgewählt ist, zur Projektseite weiterleiten
  useEffect(() => {
    if (!currentProject) {
      toast.info("Bitte wählen Sie ein Projekt aus");
      navigate("/projects");
      return;
    }
    
    // Letzten Zugriffszeitpunkt aktualisieren
    const updateAccess = async () => {
      if (isUpdating || !currentProject) return;
      
      try {
        setIsUpdating(true);
        await updateProject(
          currentProject.id, 
          { lastAccessed: new Date() }, 
          true
        );
      } catch (error) {
        console.error("Fehler beim Aktualisieren des Zugriffszeitpunkts:", error);
      } finally {
        setIsUpdating(false);
      }
    };
    
    updateAccess();
  }, [currentProject, navigate, updateProject, isUpdating]);

  // Nichts rendern, wenn kein Projekt ausgewählt ist
  if (!currentProject) {
    return null;
  }

  return (
    <div className="flex-1 flex flex-col h-full p-4 md:p-6">
      <div className="flex-1 grid gap-6 grid-cols-1 lg:grid-cols-3 h-full">
        <div className="lg:col-span-2 flex flex-col h-full overflow-hidden">
          <InterviewNotesPanel 
            showLiveNotes={showLiveNotes} 
            setShowLiveNotes={setShowLiveNotes} 
            projectId={currentProject.id}
          />
        </div>
        
        <div className="flex flex-col gap-6 h-full overflow-hidden">
          <div className="flex-shrink-0">
            <WatchTile 
              showLiveNotes={showLiveNotes} 
              projectId={currentProject.id}
            />
          </div>
          <div className="flex-1 overflow-hidden">
            <MessengerTile 
              projectId={currentProject.id}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
