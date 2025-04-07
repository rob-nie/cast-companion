
import React, { useState, useEffect } from "react";
import MessageList from "@/components/messenger/MessageList";
import MessageInput from "@/components/messenger/MessageInput";
import { useMessages } from "@/context/MessagesContext";
import { useUser } from "@/context/UserContext";
import QuickPhrases from "@/components/messenger/QuickPhrases";

const MessengerTile = () => {
  const { user } = useUser();
  const [isImportant, setIsImportant] = useState(false);
  const [showQuickPhrases, setShowQuickPhrases] = useState(false);
  const [inputValue, setInputValue] = useState("");
  
  // Safely access the messages context
  const messagesContext = useMessages();
  
  if (!messagesContext) {
    return (
      <div className="tile flex items-center justify-center h-full">
        <p className="text-muted-foreground">
          Messenger-Komponente wird geladen...
        </p>
      </div>
    );
  }
  
  const { 
    messages, 
    markAllAsRead, 
    addMessage, 
    markAsRead, 
    toggleImportant, 
    quickPhrases, 
    getQuickPhrasesForUser 
  } = messagesContext;

  if (!user) {
    return (
      <div className="tile flex items-center justify-center h-full">
        <p className="text-muted-foreground">
          Bitte melde dich an, um den Chat zu nutzen.
        </p>
      </div>
    );
  }
  
  const currentUserId = user.id;
  const userQuickPhrases = getQuickPhrasesForUser(currentUserId);
  
  // Use a separate effect component to safely call hooks
  const MessengerEffect = () => {
    // Mark all messages as read when the component is displayed
    useEffect(() => {
      markAllAsRead();
    }, []);
    
    return null;
  };

  const handleSendMessage = (content: string) => {
    addMessage(content, undefined, isImportant);
  };

  const handleSelectQuickPhrase = (content: string) => {
    setInputValue(content);
  };

  return (
    <div className="tile flex flex-col h-full overflow-hidden">
      <MessengerEffect />
      <div className="flex-1 overflow-auto">
        <MessageList 
          messages={messages}
          currentUserId={currentUserId}
          markAsRead={markAsRead}
          toggleImportant={toggleImportant}
        />
      </div>
      <div className="mt-4">
        <MessageInput 
          onSendMessage={handleSendMessage}
          isImportant={isImportant}
          setIsImportant={setIsImportant}
          inputValue={inputValue}
          setInputValue={setInputValue}
        />
        <QuickPhrases
          quickPhrases={userQuickPhrases || []}
          onSelectPhrase={handleSelectQuickPhrase}
          showQuickPhrases={showQuickPhrases}
          setShowQuickPhrases={setShowQuickPhrases}
        />
      </div>
    </div>
  );
};

export default MessengerTile;
