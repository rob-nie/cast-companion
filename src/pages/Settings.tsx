
import { useState } from "react";
import PageLayout from "@/components/layout/PageLayout";
import QuickPhrases from "@/components/settings/QuickPhrases";
import ProfileSettings from "@/components/settings/ProfileSettings";
import ProjectMembers from "@/components/projects/ProjectMembers";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Moon, Sun, User, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/context/ThemeContext";
import { useUser } from "@/context/UserContext";
import { useProjects } from "@/context/ProjectContext";

const Settings = () => {
  const { theme, setTheme } = useTheme();
  const { user, isAuthenticated, logout } = useUser();
  const { currentProject } = useProjects();
  const [defaultTab, setDefaultTab] = useState("profile");

  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Einstellungen</h1>
            <p className="text-muted-foreground mt-1">
              Passe deine Interview-Umgebung an
            </p>
          </div>
          {isAuthenticated && (
            <Button 
              variant="outline" 
              onClick={logout}
              className="hover:bg-destructive hover:text-destructive-foreground"
            >
              Abmelden
            </Button>
          )}
        </div>

        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid grid-cols-4 w-full max-w-md mb-6">
            {isAuthenticated && (
              <TabsTrigger value="profile" className="flex items-center justify-center gap-1">
                <User className="h-4 w-4" />
                <span>Profil</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="appearance">Darstellung</TabsTrigger>
            <TabsTrigger value="quick-phrases" className="flex items-center justify-center gap-1">
              <MessageSquare className="h-4 w-4" />
              <span>Quick Phrases</span>
            </TabsTrigger>
            {currentProject && (
              <TabsTrigger value="members" className="flex items-center justify-center gap-1">
                <Users className="h-4 w-4" />
                <span>Mitglieder</span>
              </TabsTrigger>
            )}
          </TabsList>
          
          {isAuthenticated && (
            <TabsContent value="profile" className="mt-0">
              <ProfileSettings />
            </TabsContent>
          )}
          
          <TabsContent value="appearance" className="mt-0">
            <div className="space-y-4">
              <div className="flex flex-col">
                <h2 className="text-xl font-semibold mb-1">Theme</h2>
                <p className="text-muted-foreground mb-4">
                  Wähle deinen bevorzugten Darstellungsmodus
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    variant={theme === "light" ? "default" : "outline"}
                    className="flex items-center justify-center gap-2 h-20 py-6"
                    onClick={() => setTheme("light")}
                  >
                    <Sun className="h-6 w-6" />
                    <div className="text-left">
                      <span className="block font-medium">Light Mode</span>
                      <span className="text-xs text-muted-foreground">
                        Helles Erscheinungsbild
                      </span>
                    </div>
                  </Button>
                  
                  <Button
                    variant={theme === "dark" ? "default" : "outline"}
                    className="flex items-center justify-center gap-2 h-20 py-6"
                    onClick={() => setTheme("dark")}
                  >
                    <Moon className="h-6 w-6" />
                    <div className="text-left">
                      <span className="block font-medium">Dark Mode</span>
                      <span className="text-xs text-muted-foreground">
                        Reduzierte Helligkeit, schont die Augen
                      </span>
                    </div>
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="quick-phrases" className="mt-0">
            <QuickPhrases />
          </TabsContent>
          
          {currentProject && (
            <TabsContent value="members" className="mt-0">
              <ProjectMembers />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </PageLayout>
  );
};

export default Settings;
