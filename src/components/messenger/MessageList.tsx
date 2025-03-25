
import { useRef, useEffect, useState } from 'react';
import { MessageSquare, ArrowDown } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import MessageComponent from './Message';
import { Message } from '@/types/messenger';

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  markAsRead: (id: string) => void;
  toggleImportant: (id: string) => void;
}

const MessageList = ({ messages, currentUserId, markAsRead, toggleImportant }: MessageListProps) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  
  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0 && isAtBottom) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else if (messages.length > 0 && !isAtBottom) {
      setHasNewMessage(true);
    }
  }, [messages.length, isAtBottom]);
  
  // Handle scroll events to track if user is at bottom
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!scrollAreaRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isScrolledToBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 10;
    
    setIsAtBottom(isScrolledToBottom);
    
    if (isScrolledToBottom && hasNewMessage) {
      setHasNewMessage(false);
    }
  };
  
  // Scroll to the latest message
  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    setHasNewMessage(false);
    setIsAtBottom(true);
  };

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-center text-muted-foreground">
        <MessageSquare className="h-8 w-8 mb-2 opacity-30" />
        <p>Noch keine Nachrichten</p>
        <p className="text-sm">Sende eine Nachricht, um zu beginnen</p>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      <ScrollArea 
        className="h-full pr-4 pb-2" 
        onScroll={handleScroll}
        ref={scrollAreaRef}
      >
        <div className="py-2 space-y-1">
          {messages.map((message) => (
            <MessageComponent 
              key={message.id}
              message={message}
              isOwnMessage={message.sender === currentUserId}
              markAsRead={markAsRead}
              toggleImportant={toggleImportant}
            />
          ))}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
      
      {/* New message indicator button */}
      {hasNewMessage && !isAtBottom && (
        <Button
          size="sm"
          className="absolute bottom-4 right-2 flex items-center gap-1 bg-primary text-primary-foreground shadow-md animate-fade-in"
          onClick={scrollToBottom}
        >
          <ArrowDown className="h-4 w-4" />
          <span>Neue Nachricht</span>
        </Button>
      )}
    </div>
  );
};

export default MessageList;
