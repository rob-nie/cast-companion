
import PageLayout from "@/components/layout/PageLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Code } from "@/components/ui/code";

const DatabaseRules = () => {
  const firebaseRules = `{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid || root.child('projectMembers').child(auth.uid).exists()",
        ".write": "$uid === auth.uid"
      }
    },
    "projects": {
      "$projectId": {
        ".read": "auth != null",
        ".write": "auth != null" 
      }
    },
    "projectMembers": {
      "$memberId": {
        ".read": "auth != null",
        ".write": "auth != null"
      }
    },
    "notes": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "messages": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(firebaseRules);
  };

  return (
    <PageLayout>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Firebase Datenbank-Regeln</h1>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Anleitung zur Konfiguration der Firebase-Regeln</CardTitle>
            <CardDescription>
              Die Fehler beim Erstellen von Projekten werden durch fehlende Berechtigungen verursacht. 
              Folgen Sie dieser Anleitung, um die Firebase Regeln zu konfigurieren.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="list-decimal pl-5 space-y-2">
              <li>Öffnen Sie die <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Firebase Console</a></li>
              <li>Wählen Sie Ihr Projekt "castcompanion-d9241"</li>
              <li>Navigieren Sie zu "Realtime Database" im linken Menü</li>
              <li>Klicken Sie auf den "Rules"-Tab</li>
              <li>Ersetzen Sie die vorhandenen Regeln durch die untenstehenden</li>
              <li>Klicken Sie auf "Veröffentlichen"</li>
            </ol>

            <div className="p-4 bg-muted rounded-md relative">
              <pre className="text-sm whitespace-pre-wrap overflow-x-auto">
                {firebaseRules}
              </pre>
              <Button 
                onClick={copyToClipboard} 
                size="sm" 
                variant="secondary" 
                className="absolute top-2 right-2"
              >
                Kopieren
              </Button>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-500 p-4 rounded">
              <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">Hinweis zur Sicherheit</h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Diese vereinfachten Regeln gewähren Zugriff für alle authentifizierten Benutzer und sind für die Testphase gedacht. 
                Für den Produktivbetrieb sollten Sie detailliertere Regeln verwenden.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default DatabaseRules;
