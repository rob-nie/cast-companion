
import React, { useState, useEffect } from "react";
import MessageList from "@/components/messenger/MessageList";
import MessageInput from "@/components/messenger/MessageInput";
import { useMessages } from "@/context/MessagesContext";
import { useUser } from "@/context/UserContext";
import QuickPhrases from "@/components/messenger/QuickPhrases";

const MessengerTile = () => {
  try {
    const { messages, markAllAsRead, addMessage, markAsRead, toggleImportant, quickPhrases, getQuickPhrasesForUser } = useMessages();
    const { user } = useUser();
    const [isImportant, setIsImportant] = useState(false);
    const [showQuickPhrases, setShowQuickPhrases] = useState(false);
    const [inputValue, setInputValue] = useState("");
    
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
    
    // Mark all messages as read when the component is displayed
    useEffect(() => {
      markAllAsRead();
    }, [markAllAsRead]);

    const handleSendMessage = (content: string) => {
      addMessage(content, undefined, isImportant); // Pass the isImportant flag
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
            quickPhrases={userQuickPhrases || []}
            onSelectPhrase={handleSelectQuickPhrase}
            showQuickPhrases={showQuickPhrases}
            setShowQuickPhrases={setShowQuickPhrases}
          />
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error in MessengerTile:", error);
    return (
      <div className="tile flex items-center justify-center h-full">
        <p className="text-destructive">
          Fehler beim Laden des Chats. Bitte versuche es erneut oder prüfe deine Berechtigungen.
        </p>
      </div>
    );
  }
};

export default MessengerTile;
