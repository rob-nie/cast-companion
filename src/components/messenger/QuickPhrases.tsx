
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QuickPhrase } from '@/types/messenger';

interface QuickPhrasesProps {
  quickPhrases: QuickPhrase[];
  onSelectPhrase: (content: string, isImportant: boolean) => void;
}

const QuickPhrases = ({ quickPhrases, onSelectPhrase }: QuickPhrasesProps) => {
  const [showQuickPhrases, setShowQuickPhrases] = useState(false);
  const [selectedImportant, setSelectedImportant] = useState<string | null>(null);

  if (quickPhrases.length === 0) {
    return null;
  }

  // Send phrase with option to mark as important
  const handlePhraseClick = (phrase: QuickPhrase) => {
    if (selectedImportant === phrase.id) {
      // Send as important and reset
      onSelectPhrase(phrase.content, true);
      setSelectedImportant(null);
    } else {
      // First click - highlight for important option
      setSelectedImportant(phrase.id);
      // Auto-send as normal after a short delay
      setTimeout(() => {
        if (selectedImportant === phrase.id) {
          onSelectPhrase(phrase.content, false);
          setSelectedImportant(null);
        }
      }, 1500);
    }
  };

  return (
    <div className="mt-2">
      <Button 
        variant="ghost" 
        size="sm"
        onClick={() => {
          setShowQuickPhrases(!showQuickPhrases);
          setSelectedImportant(null);
        }}
        className="text-xs h-7 px-2 mb-1"
      >
        {showQuickPhrases ? 'Quick Phrases ausblenden' : 'Quick Phrases anzeigen'}
      </Button>
      
      {showQuickPhrases && (
        <div className="flex flex-wrap gap-2 mt-1">
          {quickPhrases.map((phrase) => (
            <Badge 
              key={phrase.id}
              variant={selectedImportant === phrase.id ? "destructive" : "outline"}
              className={`cursor-pointer ${
                selectedImportant === phrase.id 
                  ? 'animate-pulse' 
                  : 'hover:bg-secondary'
              } transition-colors py-1.5`}
              onClick={() => handlePhraseClick(phrase)}
            >
              {phrase.content}
              {selectedImportant === phrase.id && " (als wichtig?)"}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuickPhrases;
