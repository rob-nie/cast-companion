import { useState } from 'react';
import { Edit, Trash2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Note } from '@/types/note';

interface NoteItemProps {
  note: Note;
  formatStopwatchTime: (time: number) => string;
  onEdit: (noteId: string, content: string) => void;
  onSave: (noteId: string, content: string) => void;
  onDelete: (noteId: string) => void;
  isEditing: boolean;
  editingContent: string;
  setEditingContent: (content: string) => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  onCancelEdit: () => void;
}

const NoteItem = ({
  note,
  formatStopwatchTime,
  onEdit,
  onSave,
  onDelete,
  isEditing,
  editingContent,
  setEditingContent,
  handleKeyDown,
  onCancelEdit
}: NoteItemProps) => {
  return (
    <div key={note.id} className="p-3 hover:bg-muted/20 transition-colors">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>
            {note.stopwatchTime !== undefined
              ? formatStopwatchTime(note.stopwatchTime)
              : 'No timestamp'}
          </span>
        </div>
        
        <div className="flex gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6" 
            onClick={() => onEdit(note.id, note.content)}
          >
            <Edit className="h-3 w-3" />
            <span className="sr-only">Edit</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 text-destructive hover:text-destructive" 
            onClick={() => onDelete(note.id)}
          >
            <Trash2 className="h-3 w-3" />
            <span className="sr-only">Delete</span>
          </Button>
        </div>
      </div>
      
      {isEditing ? (
        <div className="flex flex-col gap-2">
          <Input
            value={editingContent}
            onChange={(e) => setEditingContent(e.target.value)}
            autoFocus
            onKeyDown={handleKeyDown}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={() => onSave(note.id, editingContent)}>Save</Button>
            <Button size="sm" variant="outline" onClick={onCancelEdit}>Cancel</Button>
          </div>
        </div>
      ) : (
        <p className="text-sm">{note.content}</p>
      )}
    </div>
  );
};

export default NoteItem;
