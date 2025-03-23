
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QuickPhrase } from '@/types/messenger';

interface QuickPhrasesProps {
  quickPhrases: QuickPhrase[];
  onSelectPhrase: (content: string) => void;
}

const QuickPhrases = ({ quickPhrases, onSelectPhrase }: QuickPhrasesProps) => {
  const [showQuickPhrases, setShowQuickPhrases] = useState(false);

  if (quickPhrases.length === 0) {
    return null;
  }

  return (
    <div className="mt-1">
      <Button 
        variant="ghost" 
        size="sm"
        onClick={() => setShowQuickPhrases(!showQuickPhrases)}
        className="text-xs h-7 px-2 mb-1"
      >
        {showQuickPhrases ? 'Hide Quick Phrases' : 'Show Quick Phrases'}
      </Button>
      
      {showQuickPhrases && (
        <div className="flex flex-wrap gap-2">
          {quickPhrases.map((phrase) => (
            <Badge 
              key={phrase.id}
              variant="outline"
              className="cursor-pointer hover:bg-secondary transition-colors py-1.5"
              onClick={() => onSelectPhrase(phrase.content)}
            >
              {phrase.content}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuickPhrases;
