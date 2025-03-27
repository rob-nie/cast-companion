
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useUser } from "@/context/UserContext";

const Index = () => {
  const { isAuthenticated } = useUser();

  return (
    <div className="relative min-h-screen bg-background">
      <header className="container mx-auto py-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">InterviewSync</h1>
          
          {isAuthenticated ? (
            <Link to="/projects">
              <Button>Meine Projekte</Button>
            </Link>
          ) : (
            <div className="space-x-4">
              <Link to="/login">
                <Button variant="ghost">Anmelden</Button>
              </Link>
              <Link to="/register">
                <Button>Registrieren</Button>
              </Link>
            </div>
          )}
        </div>
      </header>
      
      <main className="container mx-auto py-24 text-center space-y-10">
        <div className="space-y-6 max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Synchronisiere deine Interviews.
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Effizientes Interview-Management mit Echtzeit-Notizen, Timer und Messaging in einer zentralen Plattform.
          </p>

          {isAuthenticated ? (
            <Link to="/projects">
              <Button size="lg" className="mt-6">
                Zu meinen Projekten
              </Button>
            </Link>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <Link to="/register">
                <Button size="lg">Jetzt starten</Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline">Anmelden</Button>
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
