
import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNotes } from '@/context/notes';
import { useProjects } from '@/context/ProjectContext';
import { useUser } from '@/context/UserContext';
import RichTextEditor from './RichTextEditor';
import LiveNotesPanel from './LiveNotesPanel';
import { FilePenLine, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface InterviewNotesPanelProps {
  showLiveNotes: boolean;
  setShowLiveNotes: (show: boolean) => void;
}

const InterviewNotesPanel = ({ 
  showLiveNotes, 
  setShowLiveNotes 
}: InterviewNotesPanelProps) => {
  const { currentProject } = useProjects();
  const { user } = useUser();
  const { interviewNotes, addNote, updateNote } = useNotes();
  const [content, setContent] = useState('');
  const [activeTab, setActiveTab] = useState(showLiveNotes ? 'live' : 'notes');
  const { toast } = useToast();

  const currentUserId = user?.id || "user-1";
  
  // Initialize content from project notes or with a template
  useEffect(() => {
    if (interviewNotes) {
      setContent(interviewNotes.content);
    } else if (currentProject) {
      // Create default interview notes if none exist for this user
      const userName = user?.name || user?.email || "User";
      const defaultContent = `<h1>${currentProject.title}</h1><p>${userName}'s Interview Notes</p>`;
      setContent(defaultContent);
      addNote({
        projectId: currentProject.id,
        content: defaultContent,
        isLiveNote: false,
      });
    }
  }, [currentProject, interviewNotes, addNote, user]);

  // Handle tab changes
  useEffect(() => {
    setShowLiveNotes(activeTab === 'live');
  }, [activeTab, setShowLiveNotes]);

  // Save notes when they're updated
  const handleContentChange = (newContent: string) => {
    // Only update if content has actually changed
    if (content !== newContent && interviewNotes) {
      setContent(newContent);
      updateNote(interviewNotes.id, { content: newContent });
      
      // Show toast notification when content is saved
      toast({
        title: "Notizen gespeichert",
        description: "Ihre Notizen wurden erfolgreich gespeichert.",
        duration: 3000,
      });
    }
  };

  if (!currentProject) return null;

  return (
    <div className="tile flex flex-col h-full overflow-hidden">
      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="h-full flex flex-col"
      >
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <TabsList className="grid grid-cols-2 w-64">
            <TabsTrigger value="notes" className="flex items-center gap-1">
              <FilePenLine className="h-4 w-4" />
              <span>Interview Notes</span>
            </TabsTrigger>
            <TabsTrigger value="live" className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              <span>Live Notes</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="notes" className="flex-1 mt-0 overflow-auto h-full">
          <RichTextEditor 
            initialContent={content} 
            onChange={handleContentChange} 
          />
        </TabsContent>
        
        <TabsContent value="live" className="flex-1 mt-0 overflow-auto h-full">
          <LiveNotesPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InterviewNotesPanel;
