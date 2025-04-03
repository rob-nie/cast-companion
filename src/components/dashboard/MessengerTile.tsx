
import { useState, useEffect, useRef } from 'react';
import { useMessages } from '@/context/MessagesContext';
import { useProjects } from '@/context/ProjectContext';
import { useUser } from '@/context/UserContext';
import { useToast } from '@/hooks/use-toast';
import MessageList from '../messenger/MessageList';
import MessageInput from '../messenger/MessageInput';
import QuickPhrases from '../messenger/QuickPhrases';
import ImportantMessageDialog from '../messenger/ImportantMessageDialog';
import { Message } from '@/types/messenger';

// Mock partner ID - would come from project data in a real app
const OTHER_USER = "user-2";

// Mock user names mapping - would come from a users service in a real app
const USER_NAMES: Record<string, string> = {
  "user-1": "Du",
  "user-2": "Gesprächspartner"
};

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
  const [isImportant, setIsImportant] = useState(false);
  const [showQuickPhrases, setShowQuickPhrases] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [importantMessage, setImportantMessage] = useState<Message | null>(null);
  
  const currentUserId = user?.id || "user-1"; // Use authenticated user ID if available
  
  // Track new messages for notification and important messages
  useEffect(() => {
    if (currentMessages.length > lastMessageCountRef.current) {
      // Check if the newest message is from the other user
      const newestMessage = currentMessages[currentMessages.length - 1];
      if (newestMessage && newestMessage.sender !== currentUserId) {
        // Show regular notification for new message
        toast({
          description: "Neue Nachricht erhalten",
          duration: 3000,
        });
        
        // If the message is important and not read, show the important message dialog
        if (newestMessage.isImportant && !newestMessage.isRead) {
          setImportantMessage(newestMessage);
        }
      }
    }
    lastMessageCountRef.current = currentMessages.length;
  }, [currentMessages, toast, currentUserId]);
  
  // Check for any important unread messages when component mounts
  useEffect(() => {
    // Find the most recent important unread message from another user
    const importantUnread = currentMessages
      .filter(msg => 
        msg.isImportant && 
        !msg.isRead && 
        msg.sender !== currentUserId
      )
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
      
    if (importantUnread) {
      setImportantMessage(importantUnread);
    }
  }, [currentMessages, currentUserId]);
  
  if (!currentProject) return null;
  
  const userQuickPhrases = getQuickPhrasesForUser(currentUserId);
  
  // Handler functions
  const handleMarkAsRead = (id: string) => {
    console.log('MessengerTile: marking message as read:', id);
    markAsRead(id);
    
    // Clear the important message if it was the one marked as read
    if (importantMessage && importantMessage.id === id) {
      setImportantMessage(null);
    }
  };
  
  const handleToggleImportant = (id: string) => {
    console.log('MessengerTile: toggling message importance:', id);
    toggleImportant(id);
  };
  
  const handleSendMessage = (content: string) => {
    if (!content.trim() || !currentProject) return;
    
    addMessage({
      projectId: currentProject.id,
      sender: currentUserId,
      content,
      isImportant,
    });
  };
  
  // Handler for quick phrases - copy to input instead of sending
  const handleSelectQuickPhrase = (content: string) => {
    setInputValue(content);
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
        <MessageInput 
          onSendMessage={handleSendMessage}
          isImportant={isImportant}
          setIsImportant={setIsImportant}
          inputValue={inputValue}
          setInputValue={setInputValue}
        />
        
        <QuickPhrases 
          quickPhrases={userQuickPhrases}
          onSelectPhrase={handleSelectQuickPhrase}
          showQuickPhrases={showQuickPhrases}
          setShowQuickPhrases={setShowQuickPhrases}
        />
      </div>
      
      {/* Important message dialog */}
      <ImportantMessageDialog 
        message={importantMessage}
        onMarkAsRead={handleMarkAsRead}
        userNames={USER_NAMES}
      />
    </div>
  );
};

export default MessengerTile;
