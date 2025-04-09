
import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNotes } from '@/context/notes';
import { useAuth } from '@/context/AuthContext';
import RichTextEditor from './RichTextEditor';
import LiveNotesPanel from './LiveNotesPanel';
import { FilePenLine, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

interface InterviewNotesPanelProps {
  showLiveNotes: boolean;
  setShowLiveNotes: (show: boolean) => void;
  projectId: string;
}

const InterviewNotesPanel = ({ 
  showLiveNotes, 
  setShowLiveNotes,
  projectId
}: InterviewNotesPanelProps) => {
  const { user } = useAuth();
  const { interviewNotes, liveNotes, addNote, updateNote, loadNotes } = useNotes();
  const [content, setContent] = useState('');
  const [activeTab, setActiveTab] = useState(showLiveNotes ? 'live' : 'notes');
  const [isInitialized, setIsInitialized] = useState(false);

  const currentUserId = user?.id || "";
  
  // Notizen für das aktuelle Projekt laden
  useEffect(() => {
    if (projectId && currentUserId && loadNotes) {
      loadNotes(projectId).catch(error => {
        console.error("Fehler beim Laden der Notizen:", error);
        toast.error("Notizen konnten nicht geladen werden");
      });
    }
  }, [projectId, currentUserId, loadNotes]);
  
  // Inhalt aus Projektnotizen initialisieren oder eine Vorlage verwenden
  useEffect(() => {
    if (interviewNotes && !isInitialized) {
      setContent(interviewNotes.content);
      setIsInitialized(true);
    } else if (projectId && currentUserId && !isInitialized) {
      // Standardnotizen erstellen, wenn keine für diesen Benutzer existieren
      const userName = user?.name || user?.email || "Benutzer";
      const defaultContent = `<h1>Interview-Notizen</h1><p>${userName}'s Notizen zum Interview</p>`;
      setContent(defaultContent);
      
      addNote({
        projectId,
        content: defaultContent,
        isLiveNote: false,
      }).then(() => {
        setIsInitialized(true);
      }).catch(error => {
        console.error("Fehler beim Erstellen der Standardnotizen:", error);
      });
    }
  }, [interviewNotes, projectId, currentUserId, addNote, user, isInitialized]);

  // Tab-Änderungen behandeln
  useEffect(() => {
    setShowLiveNotes(activeTab === 'live');
  }, [activeTab, setShowLiveNotes]);

  // Notizen speichern, wenn sie aktualisiert werden
  const handleContentChange = (newContent: string) => {
    // Nur aktualisieren, wenn sich der Inhalt tatsächlich geändert hat
    if (content !== newContent && interviewNotes) {
      setContent(newContent);
      updateNote(interviewNotes.id, { content: newContent })
        .then(() => {
          // Toast-Benachrichtigung anzeigen, wenn Inhalt gespeichert wird
          toast.success("Notizen gespeichert");
        })
        .catch(error => {
          console.error("Fehler beim Speichern der Notizen:", error);
          toast.error("Notizen konnten nicht gespeichert werden");
        });
    }
  };

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
              <span>Interview-Notizen</span>
            </TabsTrigger>
            <TabsTrigger value="live" className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              <span>Live-Notizen</span>
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
          <LiveNotesPanel projectId={projectId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InterviewNotesPanel;
