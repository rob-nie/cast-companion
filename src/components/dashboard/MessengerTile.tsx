
import { useState, useRef, useEffect } from 'react';
import { Check, Send, MessageSquare, Flag, FlagOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useMessages } from '@/context/MessagesContext';
import { useProjects } from '@/context/ProjectContext';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu';

// Mock user IDs - would come from an auth system in a real app
const CURRENT_USER = "user-1";
const OTHER_USER = "user-2";

const MessengerTile = () => {
  const { currentProject } = useProjects();
  const { currentMessages, addMessage, markAsRead, toggleImportant, quickPhrases, getQuickPhrasesForUser } = useMessages();
  const [newMessage, setNewMessage] = useState('');
  const [isImportant, setIsImportant] = useState(false);
  const [showQuickPhrases, setShowQuickPhrases] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages]);
  
  if (!currentProject) return null;
  
  const userQuickPhrases = getQuickPhrasesForUser(CURRENT_USER);
  
  const handleSendMessage = (content: string = newMessage) => {
    if (!content.trim() || !currentProject) return;
    
    addMessage({
      projectId: currentProject.id,
      sender: CURRENT_USER,
      content,
      isImportant,
    });
    
    setNewMessage('');
    setIsImportant(false);
    setShowQuickPhrases(false);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  return (
    <div className="tile flex flex-col h-full">
      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full pr-2 mb-2" ref={scrollAreaRef}>
          {currentMessages.length > 0 ? (
            <div className="space-y-3">
              {currentMessages.map((message) => {
                const isOwnMessage = message.sender === CURRENT_USER;
                
                return (
                  <ContextMenu key={message.id}>
                    <ContextMenuTrigger>
                      <div 
                        className={cn(
                          "flex gap-1",
                          isOwnMessage ? "justify-end" : "justify-start"
                        )}
                      >
                        <div 
                          className={cn(
                            "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                            isOwnMessage 
                              ? message.isImportant 
                                ? "bg-important text-white border border-important/20" 
                                : "bg-secondary/60 text-secondary-foreground"
                              : message.isImportant
                                ? "bg-important text-white border border-important/20"
                                : message.isRead
                                  ? "bg-read text-secondary-foreground/80"
                                  : "bg-muted/30 text-secondary-foreground"
                          )}
                        >
                          <p className="break-words">{message.content}</p>
                          <div className="flex items-center justify-end mt-1 gap-1 text-[0.65rem] opacity-80">
                            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            
                            {isOwnMessage && message.isRead && (
                              <Check className="h-3 w-3 ml-0.5" />
                            )}
                            
                            {message.isImportant && (
                              <Flag className="h-3 w-3 text-red-400" />
                            )}
                          </div>
                        </div>
                        
                        {/* Controls - only show mark important for own messages, read status for others */}
                        <div className="flex flex-col gap-1">
                          {!isOwnMessage && !message.isRead && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={() => markAsRead(message.id)}
                              title="Mark as read"
                            >
                              <Check className="h-3 w-3" />
                              <span className="sr-only">Mark as read</span>
                            </Button>
                          )}
                          
                          {isOwnMessage && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={() => toggleImportant(message.id)}
                              title={message.isImportant ? "Remove importance" : "Mark as important"}
                            >
                              {message.isImportant ? (
                                <FlagOff className="h-3 w-3" />
                              ) : (
                                <Flag className="h-3 w-3" />
                              )}
                              <span className="sr-only">Toggle importance</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    </ContextMenuTrigger>
                    {isOwnMessage && (
                      <ContextMenuContent>
                        <ContextMenuItem onClick={() => toggleImportant(message.id)}>
                          {message.isImportant ? (
                            <>
                              <FlagOff className="h-4 w-4 mr-2" />
                              Remove importance
                            </>
                          ) : (
                            <>
                              <Flag className="h-4 w-4 mr-2" />
                              Mark as important
                            </>
                          )}
                        </ContextMenuItem>
                      </ContextMenuContent>
                    )}
                    {!isOwnMessage && !message.isRead && (
                      <ContextMenuContent>
                        <ContextMenuItem onClick={() => markAsRead(message.id)}>
                          <Check className="h-4 w-4 mr-2" />
                          Mark as read
                        </ContextMenuItem>
                      </ContextMenuContent>
                    )}
                  </ContextMenu>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-center text-muted-foreground">
              <MessageSquare className="h-8 w-8 mb-2 opacity-30" />
              <p>No messages yet</p>
              <p className="text-sm">Send a message to get started</p>
            </div>
          )}
        </ScrollArea>
      </div>
      
      <div className="mt-auto flex flex-col gap-2">
        <div className="flex gap-2">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            onKeyDown={handleKeyDown}
            className="flex-1 min-h-[2.5rem] max-h-[8rem] resize-none"
            rows={1}
          />
          <Button 
            size="icon"
            disabled={!newMessage.trim()}
            onClick={() => handleSendMessage()}
            className="h-auto"
          >
            <Send className="h-4 w-4" />
            <span className="sr-only">Send</span>
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Checkbox 
            id="mark-important"
            checked={isImportant}
            onCheckedChange={(checked) => setIsImportant(checked === true)}
          />
          <label 
            htmlFor="mark-important" 
            className="text-sm cursor-pointer"
          >
            Mark as important
          </label>
        </div>
        
        {userQuickPhrases.length > 0 && (
          <div className="mt-1">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowQuickPhrases(!showQuickPhrases)}
              className="text-xs h-7 px-2 mb-1"
            >
              {showQuickPhrases ? 'Hide Quick Phrases' : 'Show Quick Phrases'}
            </Button>
            
            {showQuickPhrases && (
              <div className="flex flex-wrap gap-2">
                {userQuickPhrases.map((phrase) => (
                  <Badge 
                    key={phrase.id}
                    variant="outline"
                    className="cursor-pointer hover:bg-secondary transition-colors py-1.5"
                    onClick={() => handleSendMessage(phrase.content)}
                  >
                    {phrase.content}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessengerTile;
