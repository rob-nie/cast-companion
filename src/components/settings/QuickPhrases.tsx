
import { useState } from 'react';
import { PlusCircle, X, Pencil, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useMessages } from '@/context/messages';
import { useUser } from '@/context/UserContext';
import { useToast } from '@/hooks/use-toast';
import { QuickPhrase } from '@/types/messenger';

const QuickPhrases = () => {
  const { quickPhrases, addQuickPhrase, updateQuickPhrase, deleteQuickPhrase, getQuickPhrasesForUser } = useMessages();
  const { user } = useUser();
  const { toast } = useToast();
  const [newPhrase, setNewPhrase] = useState('');
  const [editMode, setEditMode] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  
  const currentUserId = user?.id || "user-1"; // Use authenticated user ID if available
  const userPhrases = getQuickPhrasesForUser(currentUserId);
  
  const handleAddPhrase = () => {
    if (newPhrase.trim()) {
      addQuickPhrase(newPhrase, currentUserId);
      setNewPhrase('');
      toast({
        description: "Quick Phrase hinzugefügt",
      });
    }
  };
  
  const handleStartEdit = (phrase: QuickPhrase) => {
    setEditMode(phrase.id);
    setEditValue(phrase.content);
  };
  
  const handleSaveEdit = (id: string) => {
    if (editValue.trim()) {
      updateQuickPhrase(id, editValue);
      setEditMode(null);
      toast({
        description: "Quick Phrase aktualisiert",
      });
    }
  };
  
  const handleCancelEdit = () => {
    setEditMode(null);
  };
  
  const handleDeletePhrase = (id: string) => {
    deleteQuickPhrase(id);
    toast({
      description: "Quick Phrase gelöscht",
      variant: "destructive",
    });
  };
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col">
        <h2 className="text-xl font-semibold mb-1">Quick Phrases</h2>
        <p className="text-muted-foreground mb-4">
          Erstelle und verwalte vordefinierte Nachrichten, die du mit einem Klick senden kannst
        </p>
        
        <div className="flex gap-2 mb-4">
          <Input
            value={newPhrase}
            onChange={(e) => setNewPhrase(e.target.value)}
            placeholder="Neue Quick Phrase eingeben..."
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleAddPhrase();
              }
            }}
          />
          <Button 
            onClick={handleAddPhrase} 
            disabled={!newPhrase.trim()}
            className="gap-1"
          >
            <PlusCircle className="h-4 w-4" />
            Hinzufügen
          </Button>
        </div>
        
        {userPhrases.length > 0 ? (
          <div className="grid gap-2">
            {userPhrases.map((phrase) => (
              <Card key={phrase.id}>
                <CardContent className="p-3 flex justify-between items-center">
                  {editMode === phrase.id ? (
                    <div className="flex-1 flex gap-2">
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        autoFocus
                        className="flex-1"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveEdit(phrase.id);
                          } else if (e.key === 'Escape') {
                            handleCancelEdit();
                          }
                        }}
                      />
                      <Button 
                        size="icon" 
                        onClick={() => handleSaveEdit(phrase.id)}
                        disabled={!editValue.trim()}
                      >
                        <Save className="h-4 w-4" />
                        <span className="sr-only">Speichern</span>
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={handleCancelEdit}
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Abbrechen</span>
                      </Button>
                    </div>
                  ) : (
                    <>
                      <span className="text-sm">{phrase.content}</span>
                      <div className="flex gap-1 ml-2">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => handleStartEdit(phrase)}
                          className="h-7 w-7"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          <span className="sr-only">Bearbeiten</span>
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => handleDeletePhrase(phrase.id)}
                          className="h-7 w-7 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span className="sr-only">Löschen</span>
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center p-8 border border-dashed rounded-lg">
            <p className="text-muted-foreground">Du hast noch keine Quick Phrases</p>
            <p className="text-sm text-muted-foreground mt-1">
              Füge Phrasen hinzu, die du häufig während Interviews verwendest
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickPhrases;
