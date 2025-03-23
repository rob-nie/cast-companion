
import { useRef, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import MessageComponent from './Message';
import { Message } from '@/types/messenger';

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  markAsRead: (id: string) => void;
  toggleImportant: (id: string) => void;
}

const MessageList = ({ messages, currentUserId, markAsRead, toggleImportant }: MessageListProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to latest message whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-center text-muted-foreground">
        <MessageSquare className="h-8 w-8 mb-2 opacity-30" />
        <p>No messages yet</p>
        <p className="text-sm">Send a message to get started</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full pr-2 mb-2" ref={scrollAreaRef}>
      <div className="space-y-0 py-2">
        {messages.map((message) => {
          const isOwnMessage = message.sender === currentUserId;
          
          return (
            <MessageComponent 
              key={message.id}
              message={message}
              isOwnMessage={isOwnMessage}
              markAsRead={markAsRead}
              toggleImportant={toggleImportant}
            />
          );
        })}
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
};

export default MessageList;
