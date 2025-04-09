
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotes } from '@/context/notes';
import { useWatch } from '@/context/watch';
import { cn } from '@/lib/utils';
import NoteItem from './notes/NoteItem';
import EmptyNoteState from './notes/EmptyNoteState';
import LiveNotesHeader from './notes/LiveNotesHeader';
import { toast } from 'sonner';

interface LiveNotesPanelProps {
  className?: string;
  projectId: string;
}

const LiveNotesPanel = ({ className, projectId }: LiveNotesPanelProps) => {
  const { liveNotes, addNote, updateNote, deleteNote, exportLiveNotesAsCSV } = useNotes();
  const { getProjectStopwatch, formatStopwatchTime } = useWatch();
  
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');

  // Projektspezifische Stoppuhr abrufen
  const projectStopwatch = getProjectStopwatch(projectId);
  
  // Sortierte Live-Notizen für das aktuelle Projekt
  const projectLiveNotes = liveNotes.filter(note => note.projectId === projectId);

  const handleAddEmptyNote = () => {
    // Prüfen, ob die Stoppuhr gestartet wurde
    if (projectStopwatch.elapsedTime === 0) {
      toast.info("Bitte starten Sie die Stoppuhr, um Zeitstempel hinzuzufügen");
    }
    
    addNote({
      projectId,
      content: '',
      stopwatchTime: projectStopwatch.elapsedTime,
      isLiveNote: true,
    })
      .then(note => {
        // Automatisch in den Bearbeitungsmodus für die neue Notiz wechseln
        if (note?.id) {
          setEditingNoteId(note.id);
          setEditingContent('');
        }
      })
      .catch(error => {
        console.error("Fehler beim Erstellen einer Live-Notiz:", error);
        toast.error("Notiz konnte nicht erstellt werden");
      });
  };
  
  const startEditingNote = (noteId: string, content: string) => {
    setEditingNoteId(noteId);
    setEditingContent(content);
  };
  
  const saveEditedNote = async () => {
    if (editingNoteId) {
      try {
        await updateNote(editingNoteId, { content: editingContent });
        toast.success("Notiz gespeichert");
        setEditingNoteId(null);
        setEditingContent('');
      } catch (error) {
        console.error("Fehler beim Speichern der Notiz:", error);
        toast.error("Notiz konnte nicht gespeichert werden");
      }
    }
  };
  
  const saveNote = async (noteId: string, content: string) => {
    try {
      await updateNote(noteId, { content });
      toast.success("Notiz gespeichert");
      setEditingNoteId(null);
      setEditingContent('');
    } catch (error) {
      console.error("Fehler beim Speichern der Notiz:", error);
      toast.error("Notiz konnte nicht gespeichert werden");
    }
  };
  
  const cancelEditing = () => {
    setEditingNoteId(null);
    setEditingContent('');
  };
  
  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteNote(noteId);
      toast.success("Notiz gelöscht");
    } catch (error) {
      console.error("Fehler beim Löschen der Notiz:", error);
      toast.error("Notiz konnte nicht gelöscht werden");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      saveEditedNote();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEditing();
    }
  };

  const handleExportCSV = () => {
    try {
      const csv = exportLiveNotesAsCSV(projectId);
      
      // Blob erstellen und herunterladen
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `live_notes_${projectId.slice(0, 8)}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("CSV-Export erfolgreich");
    } catch (error) {
      console.error("Fehler beim Exportieren der Notizen:", error);
      toast.error("CSV-Export fehlgeschlagen");
    }
  };

  // Notizen sortieren - neueste am unteren Ende (höhere stopwatchTime)
  const sortedNotes = [...projectLiveNotes].sort((a, b) => (a.stopwatchTime || 0) - (b.stopwatchTime || 0));

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <LiveNotesHeader 
        onExportCSV={handleExportCSV} 
        hasNotes={sortedNotes.length > 0} 
      />

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
        >
          <Plus className="h-4 w-4" />
          Neue Live-Notiz
        </Button>
      </div>
    </div>
  );
};

export default LiveNotesPanel;
