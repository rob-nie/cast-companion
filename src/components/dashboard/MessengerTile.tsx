
import { useState, useEffect, useRef } from 'react';
import { useMessages } from '@/context/messages';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import MessageList from '../messenger/MessageList';
import MessageInput from '../messenger/MessageInput';
import QuickPhrases from '../messenger/QuickPhrases';
import ImportantMessageDialog from '../messenger/ImportantMessageDialog';
import { Message } from '@/types/messenger';

// Namen-Mapping für Benutzer - würde in einer echten App aus einem Benutzerdienst kommen
const USER_NAMES: Record<string, string> = {
  "default": "Gesprächspartner"
};

interface MessengerTileProps {
  projectId: string;
}

const MessengerTile = ({ projectId }: MessengerTileProps) => {
  const { user } = useAuth();
  const { 
    getMessagesForProject,
    addMessage, 
    markAsRead, 
    toggleImportant, 
    getQuickPhrasesForUser 
  } = useMessages();
  
  const [isLoading, setIsLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const lastMessageCountRef = useRef(0);
  const [isImportant, setIsImportant] = useState(false);
  const [showQuickPhrases, setShowQuickPhrases] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [importantMessage, setImportantMessage] = useState<Message | null>(null);
  
  const currentUserId = user?.id || "";
  
  // Nachrichten für das aktuelle Projekt laden
  useEffect(() => {
    if (!projectId || !currentUserId) {
      setMessages([]);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const projectMessages = getMessagesForProject(projectId);
      setMessages(projectMessages);
      lastMessageCountRef.current = projectMessages.length;
    } catch (error) {
      console.error("Fehler beim Laden der Nachrichten:", error);
      toast.error("Nachrichten konnten nicht geladen werden");
    } finally {
      setIsLoading(false);
    }
  }, [projectId, currentUserId, getMessagesForProject]);
  
  // Neue Nachrichten für Benachrichtigungen verfolgen
  useEffect(() => {
    if (messages.length > lastMessageCountRef.current) {
      // Prüfen, ob die neueste Nachricht vom anderen Benutzer ist
      const newestMessage = messages[messages.length - 1];
      if (newestMessage && newestMessage.sender !== currentUserId) {
        // Reguläre Benachrichtigung für neue Nachricht anzeigen
        toast("Neue Nachricht erhalten");
        
        // Wenn die Nachricht wichtig und nicht gelesen ist, wichtige Nachricht-Dialog anzeigen
        if (newestMessage.isImportant && !newestMessage.isRead) {
          setImportantMessage(newestMessage);
        }
      }
    }
    lastMessageCountRef.current = messages.length;
  }, [messages, currentUserId]);
  
  // Auf wichtige ungelesene Nachrichten prüfen, wenn die Komponente mountet
  useEffect(() => {
    // Die neueste wichtige ungelesene Nachricht vom anderen Benutzer finden
    const importantUnread = messages
      .filter(msg => 
        msg.isImportant && 
        !msg.isRead && 
        msg.sender !== currentUserId
      )
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
      
    if (importantUnread) {
      setImportantMessage(importantUnread);
    }
  }, [messages, currentUserId]);
  
  // Handler-Funktionen
  const handleMarkAsRead = (id: string) => {
    console.log('MessengerTile: Nachricht als gelesen markieren:', id);
    markAsRead(id);
    
    // Wichtige Nachricht löschen, wenn sie als gelesen markiert wurde
    if (importantMessage && importantMessage.id === id) {
      setImportantMessage(null);
    }
  };
  
  const handleToggleImportant = (id: string) => {
    console.log('MessengerTile: Nachricht-Wichtigkeit umschalten:', id);
    toggleImportant(id);
  };
  
  const handleSendMessage = (content: string) => {
    if (!content.trim() || !projectId) return;
    
    addMessage({
      projectId,
      sender: currentUserId,
      content,
      isImportant,
    });
    
    // Wichtig-Flag nach dem Senden einer wichtigen Nachricht zurücksetzen
    if (isImportant) {
      setIsImportant(false);
    }
  };
  
  // Handler für schnelle Phrasen - in Eingabe kopieren statt zu senden
  const handleSelectQuickPhrase = (content: string) => {
    setInputValue(content);
  };
  
  // Benutzername basierend auf ID bekommen
  const getUserName = (userId: string): string => {
    if (userId === currentUserId) {
      return "Du";
    }
    
    if (USER_NAMES[userId]) {
      return USER_NAMES[userId];
    }
    
    return USER_NAMES.default || "Gesprächspartner";
  };
  
  return (
    <div className="tile flex flex-col h-full overflow-hidden">
      {/* Nachrichtenliste mit Container mit fester Höhe - verbleibenden Platz einnehmen */}
      <div className="flex-1 overflow-hidden">
        <MessageList 
          messages={messages}
          currentUserId={currentUserId}
          markAsRead={handleMarkAsRead}
          toggleImportant={handleToggleImportant}
          getUserName={getUserName}
        />
      </div>
      
      {/* Nachrichteneingabe und schnelle Phrasen am unteren Rand positionieren */}
      <div className="mt-auto pt-3 border-t border-border/30 flex-shrink-0">
        <MessageInput 
          onSendMessage={handleSendMessage}
          isImportant={isImportant}
          setIsImportant={setIsImportant}
          inputValue={inputValue}
          setInputValue={setInputValue}
        />
        
        <QuickPhrases 
          quickPhrases={getQuickPhrasesForUser(currentUserId)}
          onSelectPhrase={handleSelectQuickPhrase}
          showQuickPhrases={showQuickPhrases}
          setShowQuickPhrases={setShowQuickPhrases}
        />
      </div>
      
      {/* Wichtige Nachricht-Dialog */}
      <ImportantMessageDialog 
        message={importantMessage}
        onMarkAsRead={handleMarkAsRead}
        userNames={USER_NAMES}
      />
    </div>
  );
};

export default MessengerTile;
