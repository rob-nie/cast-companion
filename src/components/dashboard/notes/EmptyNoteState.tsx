
import { MessageCircle } from 'lucide-react';

const EmptyNoteState = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-4 text-muted-foreground">
      <MessageCircle className="h-8 w-8 mb-2 opacity-30" />
      <p>No live notes yet</p>
      <p className="text-sm">Add notes during the interview</p>
    </div>
  );
};

export default EmptyNoteState;
