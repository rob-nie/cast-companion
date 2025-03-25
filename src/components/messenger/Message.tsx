
import { Check, Flag, FlagOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu';
import { Message } from '@/types/messenger';

interface MessageProps {
  message: Message;
  isOwnMessage: boolean;
  markAsRead: (id: string) => void;
  toggleImportant: (id: string) => void;
}

const MessageComponent = ({ message, isOwnMessage, markAsRead, toggleImportant }: MessageProps) => {
  console.log('Message component rendered:', message.id, 'isRead:', message.isRead, 'isImportant:', message.isImportant);
  
  const handleMarkAsRead = () => {
    console.log('Marking as read:', message.id);
    markAsRead(message.id);
  };
  
  const handleToggleImportant = () => {
    console.log('Toggling important flag:', message.id, 'current state:', message.isImportant);
    toggleImportant(message.id);
  };
  
  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div 
          className={cn(
            "flex gap-1 mb-3",
            isOwnMessage ? "justify-end" : "justify-start"
          )}
        >
          <div 
            className={cn(
              "max-w-[80%] rounded-lg px-3 py-2 text-sm",
              isOwnMessage 
                ? "bg-secondary text-secondary-foreground"
                : message.isRead
                  ? "bg-read text-secondary-foreground/80"
                  : "bg-muted text-secondary-foreground",
              message.isImportant && "border-2 border-important/70"
            )}
          >
            <p className="break-words">{message.content}</p>
            <div className="flex items-center justify-end mt-1 gap-1 text-[0.65rem] opacity-80">
              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              
              {isOwnMessage && message.isRead && (
                <Check className="h-3 w-3 ml-0.5" />
              )}
              
              {message.isImportant && (
                <Flag className="h-3 w-3 text-important/80" />
              )}
            </div>
          </div>
          
          {/* Controls - fixed pointer-events issues */}
          <div className="flex flex-col gap-1">
            {!isOwnMessage && !message.isRead && (
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 pointer-events-auto"
                onClick={handleMarkAsRead}
                title="Mark as read"
              >
                <Check className="h-3 w-3 pointer-events-none" />
                <span className="sr-only">Mark as read</span>
              </Button>
            )}
            
            {/* Only allow marking messages as important by the sender */}
            {isOwnMessage && (
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 pointer-events-auto"
                onClick={handleToggleImportant}
                title={message.isImportant ? "Remove importance" : "Mark as important"}
              >
                {message.isImportant ? (
                  <FlagOff className="h-3 w-3 pointer-events-none" />
                ) : (
                  <Flag className="h-3 w-3 pointer-events-none" />
                )}
                <span className="sr-only">Toggle importance</span>
              </Button>
            )}
          </div>
        </div>
      </ContextMenuTrigger>
      
      {/* Context menu - only show toggle important for sender */}
      {isOwnMessage && (
        <ContextMenuContent>
          <ContextMenuItem onClick={handleToggleImportant} className="pointer-events-auto">
            {message.isImportant ? (
              <>
                <FlagOff className="h-4 w-4 mr-2 pointer-events-none" />
                Remove importance
              </>
            ) : (
              <>
                <Flag className="h-4 w-4 mr-2 pointer-events-none" />
                Mark as important
              </>
            )}
          </ContextMenuItem>
        </ContextMenuContent>
      )}
      {!isOwnMessage && !message.isRead && (
        <ContextMenuContent>
          <ContextMenuItem onClick={handleMarkAsRead} className="pointer-events-auto">
            <Check className="h-4 w-4 mr-2 pointer-events-none" />
            Mark as read
          </ContextMenuItem>
        </ContextMenuContent>
      )}
    </ContextMenu>
  );
};

export default MessageComponent;
