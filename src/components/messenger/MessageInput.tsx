
import { useState, useEffect } from 'react';
import { Send, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  isImportant: boolean;
  setIsImportant: (isImportant: boolean) => void;
  inputValue?: string;
  setInputValue?: (value: string) => void;
}

const MessageInput = ({ 
  onSendMessage, 
  isImportant, 
  setIsImportant,
  inputValue,
  setInputValue
}: MessageInputProps) => {
  const [newMessage, setNewMessage] = useState('');

  // Update internal state when inputValue prop changes
  useEffect(() => {
    if (inputValue !== undefined) {
      setNewMessage(inputValue);
    }
  }, [inputValue]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    onSendMessage(newMessage);
    setNewMessage('');
    // Reset important flag after sending
    setIsImportant(false);
    // Update parent state if provided
    if (setInputValue) {
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    // Update parent state if provided
    if (setInputValue) {
      setInputValue(e.target.value);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Textarea
          value={newMessage}
          onChange={handleChange}
          placeholder="Nachricht schreiben..."
          onKeyDown={handleKeyDown}
          className="flex-1 min-h-[2.5rem] max-h-[8rem] resize-y"
          rows={1}
        />
        <Button 
          size="icon"
          variant={isImportant ? "destructive" : "outline"}
          onClick={() => setIsImportant(!isImportant)}
          className="h-auto"
          title={isImportant ? "Als wichtig markiert" : "Als wichtig markieren"}
        >
          <Flag className="h-4 w-4" fill={isImportant ? "currentColor" : "none"} />
          <span className="sr-only">{isImportant ? "Als wichtig markiert" : "Als wichtig markieren"}</span>
        </Button>
        <Button 
          size="icon"
          disabled={!newMessage.trim()}
          onClick={handleSendMessage}
          className="h-auto"
        >
          <Send className="h-4 w-4" />
          <span className="sr-only">Senden</span>
        </Button>
      </div>
    </div>
  );
};

export default MessageInput;
