
import PageLayout from "@/components/layout/PageLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Code } from "@/components/ui/code";
import DatabaseConnectionTest from "@/components/projects/DatabaseConnectionTest";
import { useUser } from "@/context/UserContext";

const Debug = () => {
  const { user, isAuthenticated } = useUser();
  
  const firebaseRules = `{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid || root.child('projectMembers').child(auth.uid).exists()",
        ".write": "$uid === auth.uid"
      }
    },
    "projects": {
      ".indexOn": ["ownerId"],
      "$projectId": {
        ".read": "auth != null && (data.child('ownerId').val() === auth.uid || root.child('projectMembers').orderByChild('projectId').equalTo($projectId).orderByChild('userId').equalTo(auth.uid).exists())",
        ".write": "auth != null && (!data.exists() || data.child('ownerId').val() === auth.uid)"
      }
    },
    "projectMembers": {
      ".indexOn": ["projectId", "userId"],
      "$memberId": {
        ".read": "auth != null",
        ".write": "auth != null && (!data.exists() || root.child('projects').child(data.child('projectId').val()).child('ownerId').val() === auth.uid)"
      }
    },
    "quickPhrases": {
      ".indexOn": ["userId"],
      "$phraseId": {
        ".read": "auth != null && data.child('userId').val() === auth.uid",
        ".write": "auth != null && (!data.exists() || data.child('userId').val() === auth.uid)"
      }
    },
    "notes": {
      ".indexOn": ["projectId"],
      "$noteId": {
        ".read": "auth != null && (root.child('projects').child(data.child('projectId').val()).child('ownerId').val() === auth.uid || root.child('projectMembers').orderByChild('projectId').equalTo(data.child('projectId').val()).orderByChild('userId').equalTo(auth.uid).exists())",
        ".write": "auth != null && (root.child('projects').child(data.child('projectId').val()).child('ownerId').val() === auth.uid || root.child('projectMembers').orderByChild('projectId').equalTo(data.child('projectId').val()).orderByChild('userId').equalTo(auth.uid).child('role').val() === 'editor')"
      }
    },
    "messages": {
      ".indexOn": ["projectId"],
      "$messageId": {
        ".read": "auth != null && (root.child('projects').child(data.child('projectId').val()).child('ownerId').val() === auth.uid || root.child('projectMembers').orderByChild('projectId').equalTo(data.child('projectId').val()).orderByChild('userId').equalTo(auth.uid).exists())",
        ".write": "auth != null && (root.child('projects').child(data.child('projectId').val()).child('ownerId').val() === auth.uid || root.child('projectMembers').orderByChild('projectId').equalTo(data.child('projectId').val()).orderByChild('userId').equalTo(auth.uid).child('role').val() in ['owner', 'editor'])"
      }
    },
    "projectStopwatches": {
      "$projectId": {
        ".read": "auth != null && (root.child('projects').child($projectId).child('ownerId').val() === auth.uid || root.child('projectMembers').orderByChild('projectId').equalTo($projectId).orderByChild('userId').equalTo(auth.uid).exists())",
        ".write": "auth != null && (root.child('projects').child($projectId).child('ownerId').val() === auth.uid || root.child('projectMembers').orderByChild('projectId').equalTo($projectId).orderByChild('userId').equalTo(auth.uid).child('role').val() in ['owner', 'editor'])"
      }
    }
  }
}`;

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
            <h2 className="text-2xl font-semibold mb-4">Supabase-Migration</h2>
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Supabase Datenbank</CardTitle>
                <CardDescription>
                  Die Anwendung verwendet jetzt Supabase für die Datenspeicherung. Firebase wird als Legacy-System unterstützt.
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
            <CardTitle>Firebase Datenbank-Regeln (Legacy)</CardTitle>
            <CardDescription>
              Diese Regeln werden für die Legacy-Firebase-Integration verwendet.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded-md relative">
              <pre className="text-sm whitespace-pre-wrap overflow-x-auto">
                {firebaseRules}
              </pre>
              <Button 
                onClick={() => copyToClipboard(firebaseRules)} 
                size="sm" 
                variant="secondary" 
                className="absolute top-2 right-2"
              >
                Kopieren
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default Debug;
