
import { useState } from 'react';
import { PlusCircle, X, Pencil, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useMessages } from '@/context/MessagesContext';
import { QuickPhrase } from '@/types/messenger';

// Mock user ID - would come from auth in a real app
const CURRENT_USER = "user-1";

const QuickPhrases = () => {
  const { quickPhrases, addQuickPhrase, updateQuickPhrase, deleteQuickPhrase, getQuickPhrasesForUser } = useMessages();
  const [newPhrase, setNewPhrase] = useState('');
  const [editMode, setEditMode] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  
  const userPhrases = getQuickPhrasesForUser(CURRENT_USER);
  
  const handleAddPhrase = () => {
    if (newPhrase.trim()) {
      addQuickPhrase(newPhrase, CURRENT_USER);
      setNewPhrase('');
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
    }
  };
  
  const handleCancelEdit = () => {
    setEditMode(null);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col">
        <h2 className="text-xl font-semibold mb-1">Quick Phrases</h2>
        <p className="text-muted-foreground mb-4">
          Create and manage pre-defined messages that you can send with a single click
        </p>
        
        <div className="flex gap-2 mb-4">
          <Input
            value={newPhrase}
            onChange={(e) => setNewPhrase(e.target.value)}
            placeholder="Enter a new quick phrase..."
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
            Add
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
                        <span className="sr-only">Save</span>
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={handleCancelEdit}
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Cancel</span>
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
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => deleteQuickPhrase(phrase.id)}
                          className="h-7 w-7 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span className="sr-only">Delete</span>
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
            <p className="text-muted-foreground">You don't have any quick phrases yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add some phrases that you use frequently during interviews
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickPhrases;
