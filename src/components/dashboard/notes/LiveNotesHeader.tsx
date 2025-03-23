
import { FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LiveNotesHeaderProps {
  onExportCSV: () => void;
  hasNotes: boolean;
}

const LiveNotesHeader = ({ onExportCSV, hasNotes }: LiveNotesHeaderProps) => {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="invisible">
        {/* Placeholder to maintain layout with button on right */}
        <Button variant="outline" size="sm" className="opacity-0">
          Placeholder
        </Button>
      </div>
      
      <Button
        variant="outline"
        size="sm"
        className="gap-1"
        onClick={onExportCSV}
        disabled={!hasNotes}
      >
        <FileDown className="h-4 w-4" />
        Export CSV
      </Button>
    </div>
  );
};

export default LiveNotesHeader;
