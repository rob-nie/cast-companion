
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QuickPhrase } from '@/types/messenger';

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
  setShowQuickPhrases
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
    </div>
  );
};

export default QuickPhrases;
