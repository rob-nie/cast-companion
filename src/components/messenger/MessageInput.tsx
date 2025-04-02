
import { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  isImportant: boolean;
  setIsImportant: (isImportant: boolean) => void;
}

const MessageInput = ({ onSendMessage, isImportant, setIsImportant }: MessageInputProps) => {
  const [newMessage, setNewMessage] = useState('');

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    onSendMessage(newMessage);
    setNewMessage('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Nachricht schreiben..."
          onKeyDown={handleKeyDown}
          className="flex-1 min-h-[2.5rem] max-h-[8rem] resize-y"
          rows={1}
        />
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
