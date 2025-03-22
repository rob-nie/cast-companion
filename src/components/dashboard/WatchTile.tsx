
import { useEffect, useState } from 'react';
import { Play, Pause, RotateCcw, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWatch } from '@/context/WatchContext';
import { Separator } from '@/components/ui/separator';
import { useNotes } from '@/context/NotesContext';
import { useProjects } from '@/context/ProjectContext';

interface WatchTileProps {
  showLiveNotes: boolean;
}

const WatchTile = ({ showLiveNotes }: WatchTileProps) => {
  const { currentProject } = useProjects();
  const { 
    isRunning, 
    elapsedTime, 
    startStopwatch, 
    stopStopwatch, 
    resetStopwatch, 
    formatStopwatchTime,
    currentTime
  } = useWatch();
  const [timeDisplay, setTimeDisplay] = useState('');
  
  // Update clock display every second
  useEffect(() => {
    setTimeDisplay(
      currentTime.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      })
    );
  }, [currentTime]);
  
  // Get current time formatted as a string
  const currentTimeStr = currentTime.toLocaleTimeString([], { 
    hour: 'numeric', 
    minute: '2-digit' 
  });
  
  // Format date as day, month day
  const currentDateStr = currentTime.toLocaleDateString([], {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });
  
  return (
    <div className="tile flex flex-col">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-xl font-semibold">Watch</h2>
      </div>
      
      <div className="flex items-center justify-center py-2">
        <Clock className="h-5 w-5 mr-2 text-muted-foreground" />
        <span className="text-2xl font-mono tracking-tight">{timeDisplay}</span>
      </div>
      
      <div className="text-center text-sm text-muted-foreground mb-3">
        {currentDateStr}
      </div>
      
      <Separator className="my-3" />
      
      <div className="flex flex-col items-center">
        <div className="text-4xl font-mono font-bold tracking-tight py-4">
          {formatStopwatchTime(elapsedTime)}
        </div>
        
        <div className="flex items-center gap-2 mt-2">
          {isRunning ? (
            <Button
              variant="outline"
              size="icon"
              onClick={stopStopwatch}
              className="h-10 w-10 rounded-full transition-all duration-300"
            >
              <Pause className="h-4 w-4" />
              <span className="sr-only">Pause</span>
            </Button>
          ) : (
            <Button
              variant="default"
              size="icon"
              onClick={startStopwatch}
              className={`h-10 w-10 rounded-full transition-all duration-300 ${elapsedTime > 0 ? 'bg-amber-500 hover:bg-amber-600' : ''}`}
            >
              <Play className="h-4 w-4" />
              <span className="sr-only">Start</span>
            </Button>
          )}
          
          <Button
            variant="outline"
            size="icon"
            onClick={resetStopwatch}
            disabled={elapsedTime === 0}
            className="h-10 w-10 rounded-full transition-all duration-300"
          >
            <RotateCcw className="h-4 w-4" />
            <span className="sr-only">Reset</span>
          </Button>
        </div>
        
        {!showLiveNotes && elapsedTime > 0 && (
          <p className="text-xs text-muted-foreground mt-3 animate-fade-in">
            Switch to Live Notes to add timestamped entries
          </p>
        )}
      </div>
    </div>
  );
};

export default WatchTile;
