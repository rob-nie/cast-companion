
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QuickPhrase } from '@/types/messenger';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface QuickPhrasesProps {
  quickPhrases: QuickPhrase[];
  onSelectPhrase: (content: string) => void;
  showQuickPhrases: boolean;
  setShowQuickPhrases: (show: boolean) => void;
  isImportant: boolean;
  setIsImportant: (isImportant: boolean) => void;
}

const QuickPhrases = ({ 
  quickPhrases, 
  onSelectPhrase, 
  showQuickPhrases, 
  setShowQuickPhrases,
  isImportant,
  setIsImportant
}: QuickPhrasesProps) => {
  if (quickPhrases.length === 0) {
    return null;
  }

  return (
    <div className="mt-2">
      <Collapsible open={showQuickPhrases} onOpenChange={setShowQuickPhrases}>
        <CollapsibleTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm"
            className="text-xs h-7 px-2 mb-1"
          >
            {showQuickPhrases ? 'Quick Phrases ausblenden' : 'Quick Phrases anzeigen'}
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="flex flex-wrap gap-2 mt-1">
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
        </CollapsibleContent>
      </Collapsible>
      
      {/* Important message toggle button at the bottom */}
      <Button
        variant={isImportant ? "destructive" : "outline"}
        size="sm"
        onClick={() => setIsImportant(!isImportant)}
        className={`mt-2 text-xs ${isImportant ? 'animate-pulse' : ''}`}
      >
        <AlertTriangle className="h-4 w-4 mr-1" />
        {isImportant ? 'Als wichtig markiert' : 'Als wichtig markieren'}
      </Button>
    </div>
  );
};

export default QuickPhrases;
