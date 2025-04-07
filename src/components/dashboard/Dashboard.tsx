
import { useState, useEffect } from "react";
import { useProjects } from "@/context/ProjectContext";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, FilePenLine } from "lucide-react";
import { useMessages } from "@/context/MessagesContext";
import InterviewNotesPanel from "./InterviewNotesPanel";
import MessengerTile from "./MessengerTile";
import WatchTile from "./WatchTile";
import { Badge } from "@/components/ui/badge";

const Dashboard = () => {
  const { currentProject } = useProjects();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [showLiveNotes, setShowLiveNotes] = useState(false);
  const [activeTab, setActiveTab] = useState<"notes" | "messages">("notes");
  
  // Access messages context safely
  const messagesContext = useMessages();
  const unreadMessages = messagesContext ? messagesContext.unreadMessages : 0;

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
    <div className="h-full p-4 md:p-6 grid gap-6 grid-cols-1 lg:grid-cols-3 overflow-hidden">
      {isMobile ? (
        // Mobile layout
        <div className="col-span-1 h-full flex flex-col gap-6 overflow-hidden">
          <div className="flex-shrink-0">
            <WatchTile showLiveNotes={showLiveNotes} />
          </div>
          
          <div className="flex-1 overflow-hidden">
            <Tabs
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as "notes" | "messages")}
              className="h-full flex flex-col"
            >
              <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <TabsList>
                  <TabsTrigger value="notes" className="flex items-center gap-1">
                    <FilePenLine className="h-4 w-4" />
                    <span>Notizen</span>
                  </TabsTrigger>
                  <TabsTrigger value="messages" className="flex items-center gap-1 relative">
                    <MessageSquare className="h-4 w-4" />
                    <span>Chat</span>
                    {unreadMessages > 0 && activeTab !== "messages" && (
                      <Badge 
                        variant="destructive" 
                        className="h-5 w-5 flex items-center justify-center p-0 absolute -top-1 -right-1 text-xs"
                      >
                        {unreadMessages}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="notes" className="flex-1 mt-0 overflow-hidden">
                <InterviewNotesPanel 
                  showLiveNotes={showLiveNotes} 
                  setShowLiveNotes={setShowLiveNotes} 
                />
              </TabsContent>
              
              <TabsContent value="messages" className="flex-1 mt-0 overflow-hidden">
                <MessengerTile />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      ) : (
        // Desktop layout (unchanged)
        <>
          <div className="lg:col-span-2 h-full flex flex-col overflow-hidden">
            <InterviewNotesPanel 
              showLiveNotes={showLiveNotes} 
              setShowLiveNotes={setShowLiveNotes} 
            />
          </div>
          
          <div className="flex flex-col gap-6 h-full overflow-hidden">
            <div className="flex-shrink-0">
              <WatchTile showLiveNotes={showLiveNotes} />
            </div>
            <div className="flex-1 overflow-hidden">
              <MessengerTile />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
