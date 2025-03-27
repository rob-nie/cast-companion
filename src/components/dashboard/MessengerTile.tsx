
import { useState, useEffect, useRef } from 'react';
import { useMessages } from '@/context/MessagesContext';
import { useProjects } from '@/context/ProjectContext';
import { useUser } from '@/context/UserContext';
import { useToast } from '@/hooks/use-toast';
import MessageList from '../messenger/MessageList';
import MessageInput from '../messenger/MessageInput';
import QuickPhrases from '../messenger/QuickPhrases';

// Mock partner ID - would come from project data in a real app
const OTHER_USER = "user-2";

const MessengerTile = () => {
  const { currentProject } = useProjects();
  const { user } = useUser();
  const { 
    currentMessages, 
    addMessage, 
    markAsRead, 
    toggleImportant, 
    getQuickPhrasesForUser 
  } = useMessages();
  const { toast } = useToast();
  const lastMessageCountRef = useRef(currentMessages.length);
  const [showQuickPhrases, setShowQuickPhrases] = useState(true);
  
  const currentUserId = user?.id || "user-1"; // Use authenticated user ID if available
  
  // Track new messages for notification
  useEffect(() => {
    if (currentMessages.length > lastMessageCountRef.current) {
      // Check if the newest message is from the other user
      const newestMessage = currentMessages[currentMessages.length - 1];
      if (newestMessage && newestMessage.sender !== currentUserId) {
        // Show notification for new message
        toast({
          description: "Neue Nachricht erhalten",
          duration: 3000,
        });
      }
    }
    lastMessageCountRef.current = currentMessages.length;
  }, [currentMessages, toast, currentUserId]);
  
  if (!currentProject) return null;
  
  const userQuickPhrases = getQuickPhrasesForUser(currentUserId);
  
  // Handler functions
  const handleMarkAsRead = (id: string) => {
    console.log('MessengerTile: marking message as read:', id);
    markAsRead(id);
  };
  
  const handleToggleImportant = (id: string) => {
    console.log('MessengerTile: toggling message importance:', id);
    toggleImportant(id);
  };
  
  const handleSendMessage = (content: string, isImportant: boolean) => {
    if (!content.trim() || !currentProject) return;
    
    addMessage({
      projectId: currentProject.id,
      sender: currentUserId,
      content,
      isImportant,
    });
  };
  
  return (
    <div className="tile flex flex-col h-full">
      {/* Message list with fixed height container - taking remaining space */}
      <div className="flex-1 overflow-hidden">
        <MessageList 
          messages={currentMessages}
          currentUserId={currentUserId}
          markAsRead={handleMarkAsRead}
          toggleImportant={handleToggleImportant}
        />
      </div>
      
      {/* Message input and quick phrases positioned at the bottom */}
      <div className="mt-auto pt-3 border-t border-border/30 flex-shrink-0">
        <MessageInput onSendMessage={handleSendMessage} />
        
        <div className="mt-2">
          <button 
            onClick={() => setShowQuickPhrases(!showQuickPhrases)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors mb-1"
          >
            {showQuickPhrases ? 'Quick Phrases ausblenden ▲' : 'Quick Phrases einblenden ▼'}
          </button>
          
          {showQuickPhrases && (
            <QuickPhrases 
              quickPhrases={userQuickPhrases}
              onSelectPhrase={(content, isImportant) => handleSendMessage(content, isImportant)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default MessengerTile;
