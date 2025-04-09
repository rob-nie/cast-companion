
import PageLayout from "@/components/layout/PageLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DatabaseConnectionTest from "@/components/projects/DatabaseConnectionTest";
import { useUser } from "@/context/UserContext";
import { supabase } from "@/integrations/supabase/client";

const Debug = () => {
  const { user, isAuthenticated } = useUser();
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <PageLayout>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Debug & Development</h1>
        
        <div className="grid gap-6 md:grid-cols-2 mb-6">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Datenbankverbindung</h2>
            <DatabaseConnectionTest />
            
            {isAuthenticated && user && (
              <div className="mt-4 p-4 border rounded-lg bg-muted/30">
                <h3 className="font-medium mb-2">Benutzer-Information</h3>
                <div className="text-sm space-y-1">
                  <p><span className="font-mono text-xs">ID:</span> {user.id}</p>
                  <p><span className="font-mono text-xs">Name:</span> {user.name}</p>
                  <p><span className="font-mono text-xs">Email:</span> {user.email}</p>
                </div>
              </div>
            )}
          </div>
          
          <div>
            <h2 className="text-2xl font-semibold mb-4">Supabase-Integration</h2>
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Supabase Datenbank</CardTitle>
                <CardDescription>
                  Die Anwendung verwendet Supabase für die Datenspeicherung.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500 p-4 rounded">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200">RLS-Policies</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Stellen Sie sicher, dass RLS (Row Level Security) Policies für alle Tabellen in Supabase aktiviert sind.
                    Bei Problemen mit dem Abrufen von Projekten, überprüfen Sie die RLS-Policies für die Tabellen "projects" und "project_members".
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Supabase-Funktionen</CardTitle>
            <CardDescription>
              Überprüfen Sie die Funktionen und die Verbindung mit der Datenbank.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={async () => {
                const { data, error } = await supabase.from('projects').select('id').limit(1);
                console.log("Supabase Test:", { data, error });
                if (error) {
                  toast.error("Fehler bei der Supabase-Verbindung");
                } else {
                  toast.success("Supabase-Verbindung erfolgreich");
                }
              }} 
              size="sm" 
              variant="secondary"
            >
              Supabase-Verbindung testen
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default Debug;
