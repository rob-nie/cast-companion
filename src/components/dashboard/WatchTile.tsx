
import { useEffect, useState } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWatch } from '@/context/WatchContext';
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
        minute: '2-digit'
      })
    );
  }, [currentTime]);
  
  // Format date as day, month day
  const currentDateStr = currentTime.toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
  
  return (
    <div className="tile flex flex-col p-3 w-full">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col items-center">
          <div className="flex items-center justify-center">
            <span className="text-base font-mono tracking-tight">{timeDisplay}</span>
          </div>
          <div className="text-xs text-muted-foreground">
            {currentDateStr}
          </div>
        </div>
        
        <div className="flex flex-col items-center">
          <div className="text-xl font-mono font-bold tracking-tight">
            {formatStopwatchTime(elapsedTime)}
          </div>
          
          <div className="flex items-center gap-1 mt-1">
            {isRunning ? (
              <Button
                variant="outline"
                size="icon"
                onClick={stopStopwatch}
                className="h-8 w-8 rounded-full transition-all duration-300"
              >
                <Pause className="h-4 w-4" />
                <span className="sr-only">Pause</span>
              </Button>
            ) : (
              <Button
                variant="default"
                size="icon"
                onClick={startStopwatch}
                className={`h-8 w-8 rounded-full transition-all duration-300 ${elapsedTime > 0 ? 'bg-amber-500 hover:bg-amber-600' : ''}`}
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
              className="h-8 w-8 rounded-full transition-all duration-300"
            >
              <RotateCcw className="h-4 w-4" />
              <span className="sr-only">Reset</span>
            </Button>
          </div>
        </div>
      </div>
      
      {!showLiveNotes && elapsedTime > 0 && (
        <p className="text-xs text-muted-foreground mt-2 text-center animate-fade-in">
          Switch to Live Notes for timestamped entries
        </p>
      )}
    </div>
  );
};

export default WatchTile;
