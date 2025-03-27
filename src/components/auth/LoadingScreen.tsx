
import { Loader2 } from "lucide-react";

const LoadingScreen = () => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
        <p className="mt-4 text-muted-foreground">Laden...</p>
      </div>
    </div>
  );
};

export default LoadingScreen;
