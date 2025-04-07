
import React, { useState, useEffect } from "react";
import MessageList from "@/components/messenger/MessageList";
import MessageInput from "@/components/messenger/MessageInput";
import { useMessages } from "@/context/MessagesContext";
import { useUser } from "@/context/UserContext";
import QuickPhrases from "@/components/messenger/QuickPhrases";

const MessengerTile = () => {
  const { messages, markAllAsRead, addMessage, markAsRead, toggleImportant } = useMessages();
  const { user } = useUser();
  const [isImportant, setIsImportant] = useState(false);
  const [showQuickPhrases, setShowQuickPhrases] = useState(false);
  const [inputValue, setInputValue] = useState("");
  
  const currentUserId = user?.id || "user-1";
  
  // Mark all messages as read when the component is displayed
  useEffect(() => {
    markAllAsRead();
  }, [markAllAsRead]);

  const handleSendMessage = (content: string) => {
    addMessage(content);
  };

  const handleSelectQuickPhrase = (content: string) => {
    setInputValue(content);
  };

  return (
    <div className="tile flex flex-col h-full overflow-hidden">
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
          quickPhrases={[]}
          onSelectPhrase={handleSelectQuickPhrase}
          showQuickPhrases={showQuickPhrases}
          setShowQuickPhrases={setShowQuickPhrases}
        />
      </div>
    </div>
  );
};

export default MessengerTile;
