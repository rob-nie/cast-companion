
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
        <div className={cn(
          "flex gap-2 mb-3",
          isOwnMessage ? "justify-end" : "justify-start"
        )}>
          {/* Action buttons for non-sender, should appear before message for left alignment */}
          {!isOwnMessage && (
            <div className="flex flex-col justify-start gap-1 mt-1">
              {!message.isRead && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleMarkAsRead}
                  className="h-6 w-6"
                  title="Als gelesen markieren"
                >
                  <Check className="h-3 w-3" />
                  <span className="sr-only">Als gelesen markieren</span>
                </Button>
              )}
            </div>
          )}
          
          {/* Message bubble */}
          <div className={cn(
            "max-w-[80%] rounded-lg px-3 py-2 text-sm",
            isOwnMessage 
              ? "bg-secondary text-secondary-foreground"
              : message.isRead
                ? "bg-muted/50 text-muted-foreground"
                : "bg-muted text-secondary-foreground",
            message.isImportant && "border-2 border-important/70"
          )}>
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
          
          {/* Action buttons for sender, should appear after message for right alignment */}
          {isOwnMessage && (
            <div className="flex flex-col justify-start gap-1 mt-1">
              <Button
                size="icon"
                variant="ghost"
                onClick={handleToggleImportant}
                className="h-6 w-6"
                title={message.isImportant ? "Wichtig entfernen" : "Als wichtig markieren"}
              >
                {message.isImportant ? (
                  <FlagOff className="h-3 w-3" />
                ) : (
                  <Flag className="h-3 w-3" />
                )}
                <span className="sr-only">Wichtig umschalten</span>
              </Button>
            </div>
          )}
        </div>
      </ContextMenuTrigger>
      
      {/* Context menu */}
      <ContextMenuContent>
        {isOwnMessage ? (
          <ContextMenuItem onClick={handleToggleImportant}>
            {message.isImportant ? (
              <>
                <FlagOff className="h-4 w-4 mr-2" />
                Wichtig entfernen
              </>
            ) : (
              <>
                <Flag className="h-4 w-4 mr-2" />
                Als wichtig markieren
              </>
            )}
          </ContextMenuItem>
        ) : (
          !message.isRead && (
            <ContextMenuItem onClick={handleMarkAsRead}>
              <Check className="h-4 w-4 mr-2" />
              Als gelesen markieren
            </ContextMenuItem>
          )
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default MessageComponent;
