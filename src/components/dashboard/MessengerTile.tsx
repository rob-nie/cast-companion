
import { useMessages } from '@/context/MessagesContext';
import { useProjects } from '@/context/ProjectContext';
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
  
  if (!currentProject) return null;
  
  const userQuickPhrases = getQuickPhrasesForUser(CURRENT_USER);
  
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
      {/* This is the fixed height container for messages */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <MessageList 
          messages={currentMessages}
          currentUserId={CURRENT_USER}
          markAsRead={markAsRead}
          toggleImportant={toggleImportant}
        />
      </div>
      
      {/* Message input positioned at the bottom */}
      <div className="mt-auto pt-2 border-t border-border/30">
        <MessageInput onSendMessage={handleSendMessage} />
        
        <QuickPhrases 
          quickPhrases={userQuickPhrases}
          onSelectPhrase={(content) => handleSendMessage(content, false)}
        />
      </div>
    </div>
  );
};

export default MessengerTile;
