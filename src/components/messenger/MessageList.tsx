
import { useRef, useEffect, useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FixedSizeList as List } from 'react-window';
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
  const listRef = useRef<List>(null);
  const [listHeight, setListHeight] = useState(300); // Default height
  
  // Update list height based on container size
  useEffect(() => {
    if (scrollAreaRef.current) {
      const updateHeight = () => {
        if (scrollAreaRef.current) {
          setListHeight(scrollAreaRef.current.clientHeight || 300);
        }
      };
      
      // Initial height
      updateHeight();
      
      // Update on resize
      window.addEventListener('resize', updateHeight);
      return () => window.removeEventListener('resize', updateHeight);
    }
  }, []);
  
  // Auto-scroll to latest message whenever messages change
  useEffect(() => {
    if (messages.length > 0 && listRef.current) {
      listRef.current.scrollToItem(messages.length - 1, 'end');
    }
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

  // Render each message row
  const MessageRow = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const message = messages[index];
    const isOwnMessage = message.sender === currentUserId;
    
    // Handle mark as read for this specific message
    const handleMarkAsRead = (id: string) => {
      markAsRead(id);
    };
    
    // Handle toggle important for this specific message
    const handleToggleImportant = (id: string) => {
      toggleImportant(id);
    };
    
    return (
      <div style={style}>
        <MessageComponent 
          key={message.id}
          message={message}
          isOwnMessage={isOwnMessage}
          markAsRead={handleMarkAsRead}
          toggleImportant={handleToggleImportant}
        />
      </div>
    );
  };

  return (
    <ScrollArea className="h-full pr-2 mb-2" ref={scrollAreaRef}>
      <div className="space-y-0 py-2">
        <List
          ref={listRef}
          height={listHeight}
          width="100%"
          itemCount={messages.length}
          itemSize={90} // Approximate height of each message
          overscanCount={5} // Number of items to render outside of the visible area
        >
          {MessageRow}
        </List>
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
};

export default MessageList;
