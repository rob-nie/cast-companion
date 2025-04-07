
import React, { useEffect } from "react";
import MessageList from "@/components/messenger/MessageList";
import MessageInput from "@/components/messenger/MessageInput";
import { useMessages } from "@/context/MessagesContext";

const MessengerTile = () => {
  const { markAllAsRead } = useMessages();
  
  // Markiere alle Nachrichten als gelesen, wenn die Komponente angezeigt wird
  useEffect(() => {
    markAllAsRead();
  }, [markAllAsRead]);

  return (
    <div className="tile flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-auto">
        <MessageList />
      </div>
      <div className="mt-4">
        <MessageInput />
      </div>
    </div>
  );
};

export default MessengerTile;
