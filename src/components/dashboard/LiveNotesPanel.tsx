
import { useState, useEffect } from 'react';
import { FileDown, Clock, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNotes } from '@/context/NotesContext';
import { useProjects } from '@/context/ProjectContext';
import { useWatch } from '@/context/WatchContext';
import { cn } from '@/lib/utils';

interface LiveNotesPanelProps {
  className?: string;
}

const LiveNotesPanel = ({ className }: LiveNotesPanelProps) => {
  const { currentProject } = useProjects();
  const { liveNotes, addNote, exportLiveNotesAsCSV } = useNotes();
  const { elapsedTime, formatStopwatchTime } = useWatch();
  
  const [newNote, setNewNote] = useState('');

  if (!currentProject) return null;

  const handleAddNote = () => {
    if (newNote.trim()) {
      addNote({
        projectId: currentProject.id,
        content: newNote,
        timestamp: new Date(),
        stopwatchTime: elapsedTime,
        isLiveNote: true,
      });
      setNewNote('');
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

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Live Notes</h2>
        <Button
          variant="outline"
          size="sm"
          className="gap-1"
          onClick={handleExportCSV}
          disabled={liveNotes.length === 0}
        >
          <FileDown className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <div className="flex-1 overflow-auto mb-4 border border-border/40 rounded-md">
        {liveNotes.length > 0 ? (
          <div className="divide-y divide-border/30">
            {liveNotes
              .sort((a, b) => (b.stopwatchTime || 0) - (a.stopwatchTime || 0))
              .map((note) => (
                <div
                  key={note.id}
                  className="p-3 hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>
                      {note.stopwatchTime !== undefined
                        ? formatStopwatchTime(note.stopwatchTime)
                        : 'No timestamp'}
                    </span>
                  </div>
                  <p className="text-sm">{note.content}</p>
                </div>
              ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-4 text-muted-foreground">
            <MessageCircle className="h-8 w-8 mb-2 opacity-30" />
            <p>No live notes yet</p>
            <p className="text-sm">Use the form below to add notes during the interview</p>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Input
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Add a note with current timestamp..."
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleAddNote();
            }
          }}
        />
        <Button onClick={handleAddNote} disabled={!newNote.trim()}>
          Add
        </Button>
      </div>
    </div>
  );
};

export default LiveNotesPanel;
