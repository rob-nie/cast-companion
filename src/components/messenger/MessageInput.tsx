
import { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';

interface MessageInputProps {
  onSendMessage: (content: string, isImportant: boolean) => void;
}

const MessageInput = ({ onSendMessage }: MessageInputProps) => {
  const [newMessage, setNewMessage] = useState('');
  const [isImportant, setIsImportant] = useState(false);
  const { toast } = useToast();

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    onSendMessage(newMessage, isImportant);
    setNewMessage('');
    
    if (isImportant) {
      toast({
        description: "Wichtige Nachricht gesendet",
      });
      setIsImportant(false);
    }
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
          Als wichtig markieren
        </label>
      </div>
    </div>
  );
};

export default MessageInput;
