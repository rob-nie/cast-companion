
import { Check, Flag, FlagOff, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu';
import { Message } from '@/types/messenger';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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
  
  // Erstellen des Namens-Initialien für den Avatar Fallback
  const getInitials = (name: string = "User") => {
    return name.charAt(0).toUpperCase();
  };

  const senderName = message.sender || "Unbekannt";
  
  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div className={cn(
          "flex gap-2 mb-3",
          isOwnMessage ? "justify-end" : "justify-start"
        )}>
          {/* Show avatar for others' messages before the message */}
          {!isOwnMessage && (
            <Avatar className="h-8 w-8 mt-1">
              <AvatarImage src={`https://avatar.vercel.sh/${message.userId}.png`} />
              <AvatarFallback>{getInitials(senderName)}</AvatarFallback>
            </Avatar>
          )}
          
          {/* Action buttons for non-sender */}
          {!isOwnMessage && (
            <div className="flex flex-col justify-start gap-1 mt-1">
              {!message.read && (
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
          
          {/* Message bubble with sender name */}
          <div className="flex flex-col max-w-[80%]">
            {/* Sender name */}
            {!isOwnMessage && (
              <span className="text-xs text-muted-foreground mb-1 ml-1">{senderName}</span>
            )}
            
            {/* Message content */}
            <div className={cn(
              "rounded-lg px-3 py-2 text-sm",
              isOwnMessage 
                ? "bg-secondary text-secondary-foreground"
                : message.read
                  ? "bg-muted/50 text-muted-foreground"
                  : "bg-muted text-secondary-foreground",
              message.isImportant && "border-2 border-important/70"
            )}>
              <p className="break-words">{message.content}</p>
              <div className="flex items-center justify-end mt-1 gap-1 text-[0.65rem] opacity-80">
                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                
                {isOwnMessage && message.read && (
                  <Check className="h-3 w-3 ml-0.5" />
                )}
                
                {message.isImportant && (
                  <Flag className="h-3 w-3 text-important/80" />
                )}
              </div>
            </div>
          </div>
          
          {/* Action buttons for sender */}
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
          !message.read && (
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
