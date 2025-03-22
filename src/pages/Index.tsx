
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronRight, Clipboard, Clock, MessageCircle } from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";

const Index = () => {
  const navigate = useNavigate();

  return (
    <PageLayout>
      <div className="flex flex-col items-center">
        <div className="w-full max-w-5xl px-4 py-10 sm:py-20 text-center space-y-8">
          <div className="animate-fade-in">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              <span className="inline-block">Interview</span>
              <span className="inline-block ml-2 text-primary">Sync</span>
            </h1>
            <p className="mt-4 text-xl text-muted-foreground max-w-2xl mx-auto">
              Streamline your interviews with real-time notes, messaging, and timing - 
              all without disrupting the conversation flow.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8 animate-slide-in">
            <Button 
              onClick={() => navigate("/projects")} 
              size="lg" 
              className="gap-2"
            >
              Get Started
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mt-16 animate-slide-in">
            <div className="glass-panel p-6 flex flex-col items-center text-center">
              <Clipboard className="h-10 w-10 text-primary mb-4" />
              <h2 className="text-xl font-semibold mb-2">Interview Notes</h2>
              <p className="text-muted-foreground">
                Keep structured notes before and during your interviews with rich text formatting.
              </p>
            </div>

            <div className="glass-panel p-6 flex flex-col items-center text-center">
              <MessageCircle className="h-10 w-10 text-primary mb-4" />
              <h2 className="text-xl font-semibold mb-2">Silent Messaging</h2>
              <p className="text-muted-foreground">
                Communicate discreetly with team members using quick phrases and importance markers.
              </p>
            </div>

            <div className="glass-panel p-6 flex flex-col items-center text-center">
              <Clock className="h-10 w-10 text-primary mb-4" />
              <h2 className="text-xl font-semibold mb-2">Synchronized Timing</h2>
              <p className="text-muted-foreground">
                Track interview progress with a shared stopwatch and timestamp your observations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default Index;
