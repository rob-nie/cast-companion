
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotes } from '@/context/NotesContext';
import { useProjects } from '@/context/ProjectContext';
import { useWatch } from '@/context/WatchContext';
import { cn } from '@/lib/utils';
import NoteItem from './notes/NoteItem';
import EmptyNoteState from './notes/EmptyNoteState';
import LiveNotesHeader from './notes/LiveNotesHeader';

interface LiveNotesPanelProps {
  className?: string;
}

const LiveNotesPanel = ({ className }: LiveNotesPanelProps) => {
  const { currentProject } = useProjects();
  const { liveNotes, addNote, updateNote, deleteNote, exportLiveNotesAsCSV } = useNotes();
  const { getProjectStopwatch, formatStopwatchTime } = useWatch();
  
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');

  if (!currentProject) return null;
  
  // Get the current project's stopwatch
  const projectStopwatch = getProjectStopwatch(currentProject.id);

  const handleAddEmptyNote = () => {
    console.log("Adding new empty note for project:", currentProject.id);
    
    const newNote = addNote({
      projectId: currentProject.id,
      content: '',
      stopwatchTime: projectStopwatch.elapsedTime,
      isLiveNote: true,
    });
    
    // Auto-enter edit mode for the new note
    if (newNote?.id) {
      console.log("Created new note with ID:", newNote.id);
      setEditingNoteId(newNote.id);
      setEditingContent('');
    } else {
      console.error("Failed to create new note, returned value:", newNote);
    }
  };
  
  const startEditingNote = (noteId: string, content: string) => {
    setEditingNoteId(noteId);
    setEditingContent(content);
  };
  
  const saveEditedNote = () => {
    if (editingNoteId) {
      updateNote(editingNoteId, { content: editingContent });
      setEditingNoteId(null);
      setEditingContent('');
    }
  };
  
  const saveNote = (noteId: string, content: string) => {
    updateNote(noteId, { content });
    setEditingNoteId(null);
    setEditingContent('');
  };
  
  const cancelEditing = () => {
    setEditingNoteId(null);
    setEditingContent('');
  };
  
  const handleDeleteNote = (noteId: string) => {
    deleteNote(noteId);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      saveEditedNote();
    }
  };

  const handleExportCSV = () => {
    if (!currentProject) return;
    
    const csv = exportLiveNotesAsCSV(currentProject.id);
    
    // Create a blob and download it
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${currentProject.title.replace(/\s+/g, '_')}_live_notes.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Sort notes - newest at the bottom (higher stopwatchTime)
  const sortedNotes = [...liveNotes].sort((a, b) => (a.stopwatchTime || 0) - (b.stopwatchTime || 0));

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <LiveNotesHeader onExportCSV={handleExportCSV} hasNotes={liveNotes.length > 0} />

      <div className="flex-1 overflow-auto mb-4 border border-border/40 rounded-md">
        {sortedNotes.length > 0 ? (
          <div className="divide-y divide-border/30">
            {sortedNotes.map((note) => (
              <NoteItem
                key={note.id}
                note={note}
                formatStopwatchTime={formatStopwatchTime}
                onEdit={startEditingNote}
                onSave={saveNote}
                onDelete={handleDeleteNote}
                isEditing={editingNoteId === note.id}
                editingContent={editingContent}
                setEditingContent={setEditingContent}
                handleKeyDown={handleKeyDown}
                onCancelEdit={cancelEditing}
              />
            ))}
          </div>
        ) : (
          <EmptyNoteState />
        )}
      </div>

      <div className="mt-auto">
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-1"
          onClick={handleAddEmptyNote}
          type="button"
        >
          <Plus className="h-4 w-4" />
          New Live Note
        </Button>
      </div>
    </div>
  );
};

export default LiveNotesPanel;
