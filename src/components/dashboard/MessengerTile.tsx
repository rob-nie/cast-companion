
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMessages } from "@/context/messages";
import { useProjectMembers } from "@/context/projectMembers";
import { useProject } from "@/context/ProjectContext";
import { ProjectMember } from "@/types/user";
import MessageList from "@/components/messenger/MessageList";
import MessageInput from "@/components/messenger/MessageInput";
import QuickPhrases from "@/components/messenger/QuickPhrases";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Message } from "@/types/messenger";

const MessengerTile = () => {
  const { currentProject } = useProject();
  const { messages, addMessage, markAsRead, toggleImportant, quickPhrases } = useMessages();
  const { getProjectMembers } = useProjectMembers();
  const [activeTab, setActiveTab] = useState("messages");
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inputValue, setInputValue] = useState("");
  const [isImportant, setIsImportant] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Filter messages for the current project
  const projectMessages = messages.filter(msg => msg.projectId === currentProject?.id);

  // Load project members
  useEffect(() => {
    if (currentProject) {
      setIsLoading(true);
      getProjectMembers(currentProject.id)
        .then(members => {
          setMembers(members);
          setIsLoading(false);
        })
        .catch(error => {
          console.error("Error fetching project members:", error);
          setIsLoading(false);
        });
    }
  }, [currentProject, getProjectMembers]);

  // Helper to get user name from ID
  const getUserName = (userId: string): string => {
    const member = members.find(m => m.id === userId);
    return member ? member.name : "Unbekannter Nutzer";
  };

  const handleSendMessage = (content: string) => {
    if (!currentProject || !content.trim()) return;

    addMessage({
      projectId: currentProject.id,
      content,
      isImportant: isImportant
    });

    // Reset after sending
    setInputValue("");
    setIsImportant(false);
  };

  if (!currentProject) {
    return (
      <Card className="flex flex-col h-full">
        <CardContent className="flex items-center justify-center h-full p-6">
          <p className="text-muted-foreground">Kein Projekt ausgewählt</p>
        </CardContent>
      </Card>
    );
  }

  if (isCollapsed) {
    return (
      <Card className="flex flex-col h-full">
        <CardContent className="p-2 flex justify-center">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setIsCollapsed(false)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-full">
      <div className="flex justify-between items-center p-3 border-b">
        <h3 className="font-medium">Nachrichten</h3>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => setIsCollapsed(true)}
        >
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col"
      >
        <TabsList className="grid grid-cols-2 mx-2 my-1">
          <TabsTrigger value="messages">Nachrichten</TabsTrigger>
          <TabsTrigger value="quick-phrases">Schnellphrasen</TabsTrigger>
        </TabsList>

        <TabsContent value="messages" className="flex-1 flex flex-col space-y-2 pt-1 pb-0 px-0 m-0">
          <div className="flex-1 overflow-y-auto px-3">
            <MessageList
              messages={projectMessages}
              currentUserId={currentProject.ownerId}
              markAsRead={markAsRead}
              toggleImportant={toggleImportant}
            />
          </div>

          <div className="p-3 pt-1">
            <MessageInput
              onSendMessage={handleSendMessage}
              isImportant={isImportant}
              setIsImportant={setIsImportant}
              inputValue={inputValue}
              setInputValue={setInputValue}
            />
          </div>
        </TabsContent>

        <TabsContent value="quick-phrases" className="flex-1 p-3 pt-1 overflow-y-auto">
          <QuickPhrases quickPhrases={quickPhrases} />
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default MessengerTile;
