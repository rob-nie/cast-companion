
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Flag } from 'lucide-react';
import { Message } from '@/types/messenger';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

interface ImportantMessageDialogProps {
  message: Message | null;
  onMarkAsRead: (id: string) => void;
  userNames: Record<string, string>;
}

const ImportantMessageDialog = ({ 
  message, 
  onMarkAsRead,
  userNames
}: ImportantMessageDialogProps) => {
  const [open, setOpen] = useState(false);

  // Open the dialog when a message is provided
  useEffect(() => {
    if (message) {
      setOpen(true);
    }
  }, [message]);

  const handleMarkAsRead = () => {
    if (message) {
      onMarkAsRead(message.id);
      setOpen(false);
    }
  };

  if (!message) return null;

  const senderName = userNames[message.sender] || 'Unbekannter Nutzer';
  const timeAgo = formatDistanceToNow(message.timestamp, { 
    addSuffix: true,
    locale: de
  });

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      // Only allow closing via the mark as read button
      // If trying to close via other means (like clicking outside),
      // we'll call handleMarkAsRead to properly mark the message as read
      if (!newOpen && open) {
        handleMarkAsRead();
      }
      setOpen(newOpen);
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 fill-destructive text-destructive" />
            <span>Wichtige Nachricht von {senderName}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="border-l-4 border-destructive pl-4 py-2 my-4">
          <p className="text-base">{message.content}</p>
          <p className="text-sm text-muted-foreground mt-1">{timeAgo}</p>
        </div>

        <DialogFooter>
          <Button onClick={handleMarkAsRead}>
            Als gelesen markieren
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportantMessageDialog;
