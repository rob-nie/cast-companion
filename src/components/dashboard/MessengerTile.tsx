
import { useState, useEffect, useRef } from 'react';
import { useMessages } from '@/context/MessagesContext';
import { useProjects } from '@/context/ProjectContext';
import { useToast } from '@/hooks/use-toast';
import MessageList from '../messenger/MessageList';
import MessageInput from '../messenger/MessageInput';
import QuickPhrases from '../messenger/QuickPhrases';

// Mock user IDs - would come from an auth system in a real app
const CURRENT_USER = "user-1";
const OTHER_USER = "user-2";

const MessengerTile = () => {
  const { currentProject } = useProjects();
  const { 
    currentMessages, 
    addMessage, 
    markAsRead, 
    toggleImportant, 
    getQuickPhrasesForUser 
  } = useMessages();
  const { toast } = useToast();
  const lastMessageCountRef = useRef(currentMessages.length);
  
  // Track new messages for notification
  useEffect(() => {
    if (currentMessages.length > lastMessageCountRef.current) {
      // Check if the newest message is from the other user
      const newestMessage = currentMessages[currentMessages.length - 1];
      if (newestMessage && newestMessage.sender !== CURRENT_USER) {
        // Show notification for new message
        toast({
          description: "Neue Nachricht erhalten",
          duration: 3000,
        });
      }
    }
    lastMessageCountRef.current = currentMessages.length;
  }, [currentMessages, toast]);
  
  if (!currentProject) return null;
  
  const userQuickPhrases = getQuickPhrasesForUser(CURRENT_USER);
  
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
      sender: CURRENT_USER,
      content,
      isImportant,
    });
  };
  
  return (
    <div className="tile flex flex-col h-full">
      {/* Message list with fixed height container */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <MessageList 
          messages={currentMessages}
          currentUserId={CURRENT_USER}
          markAsRead={handleMarkAsRead}
          toggleImportant={handleToggleImportant}
        />
      </div>
      
      {/* Message input and quick phrases positioned at the bottom */}
      <div className="mt-auto pt-3 border-t border-border/30">
        <MessageInput onSendMessage={handleSendMessage} />
        
        <QuickPhrases 
          quickPhrases={userQuickPhrases}
          onSelectPhrase={(content, isImportant) => handleSendMessage(content, isImportant)}
        />
      </div>
    </div>
  );
};

export default MessengerTile;
