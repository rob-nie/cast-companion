
import { useEffect, useState } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWatch } from '@/context/watch';
import { toast } from 'sonner';

interface WatchTileProps {
  showLiveNotes: boolean;
  projectId: string;
}

const WatchTile = ({ showLiveNotes, projectId }: WatchTileProps) => {
  const { 
    getProjectStopwatch,
    startStopwatch, 
    stopStopwatch, 
    resetStopwatch, 
    formatStopwatchTime,
    currentTime
  } = useWatch();
  
  const [timeDisplay, setTimeDisplay] = useState('');
  
  // Clock-Display jede Sekunde aktualisieren
  useEffect(() => {
    setTimeDisplay(
      currentTime.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit'
      })
    );
    
    const timeInterval = setInterval(() => {
      setTimeDisplay(
        new Date().toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit'
        })
      );
    }, 1000);
    
    return () => clearInterval(timeInterval);
  }, [currentTime]);
  
  // Datum formatieren als Tag, Monat Tag
  const currentDateStr = currentTime.toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });

  // Stoppuhr für das aktuelle Projekt abrufen
  const stopwatch = getProjectStopwatch(projectId);
  const { isRunning, elapsedTime } = stopwatch;
  
  const handleStart = () => {
    if (!projectId) {
      toast.error("Kein Projekt ausgewählt");
      return;
    }
    
    startStopwatch(projectId);
    toast.success("Stoppuhr gestartet");
  };
  
  const handleStop = () => {
    if (!projectId) {
      return;
    }
    
    stopStopwatch(projectId);
    toast.info("Stoppuhr angehalten");
  };
  
  const handleReset = () => {
    if (!projectId) {
      return;
    }
    
    // Bestätigung vor dem Zurücksetzen anfordern, wenn Zeit vergangen ist
    if (elapsedTime > 60000) { // Mehr als eine Minute
      if (!window.confirm("Möchten Sie die Stoppuhr wirklich zurücksetzen?")) {
        return;
      }
    }
    
    resetStopwatch(projectId);
    toast.info("Stoppuhr zurückgesetzt");
  };
  
  return (
    <div className="tile flex flex-col p-3 w-full">
      <div className="grid grid-cols-2 gap-3 h-full items-center">
        <div className="flex flex-col items-center justify-center">
          <div className="flex items-center justify-center">
            <span className="text-base font-sans tracking-tight">{timeDisplay}</span>
          </div>
          <div className="text-xs text-muted-foreground">
            {currentDateStr}
          </div>
        </div>
        
        <div className="flex flex-col items-center justify-center">
          <div className="text-xl font-sans font-bold tracking-tight">
            {formatStopwatchTime(elapsedTime)}
          </div>
          
          <div className="flex items-center gap-1 mt-1">
            {isRunning ? (
              <Button
                variant="outline"
                size="icon"
                onClick={handleStop}
                className="h-8 w-8 rounded-full transition-all duration-300"
              >
                <Pause className="h-4 w-4" />
                <span className="sr-only">Pause</span>
              </Button>
            ) : (
              <Button
                variant="default"
                size="icon"
                onClick={handleStart}
                className={`h-8 w-8 rounded-full transition-all duration-300 ${elapsedTime > 0 ? 'bg-amber-500 hover:bg-amber-600' : ''}`}
              >
                <Play className="h-4 w-4" />
                <span className="sr-only">Start</span>
              </Button>
            )}
            
            <Button
              variant="outline"
              size="icon"
              onClick={handleReset}
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
          Zu Live-Notizen wechseln für Zeitstempel-Einträge
        </p>
      )}
    </div>
  );
};

export default WatchTile;
