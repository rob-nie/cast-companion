
import { useState } from "react";
import PageLayout from "@/components/layout/PageLayout";
import QuickPhrases from "@/components/settings/QuickPhrases";
import ProfileSettings from "@/components/settings/ProfileSettings";
import ProjectSettings from "@/components/settings/ProjectSettings";
import ProjectMembers from "@/components/projects/ProjectMembers";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Moon, Sun, User, Users, Settings as SettingsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/context/ThemeContext";
import { useUser } from "@/context/UserContext";
import { useProjects } from "@/context/ProjectContext";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";

const Settings = () => {
  const { theme, setTheme } = useTheme();
  const { user, isAuthenticated, logout } = useUser();
  const { currentProject } = useProjects();
  const [defaultTab, setDefaultTab] = useState("profile");

  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto w-full">
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
          <TabsList className="grid grid-cols-2 w-full max-w-md mb-6">
            <TabsTrigger value="profile" className="flex items-center justify-center gap-1">
              <User className="h-4 w-4" />
              <span>Profileinstellungen</span>
            </TabsTrigger>
            <TabsTrigger value="project" className="flex items-center justify-center gap-1">
              <SettingsIcon className="h-4 w-4" />
              <span>Projekteinstellungen</span>
            </TabsTrigger>
          </TabsList>
          
          {/* Profile Settings Tab */}
          <TabsContent value="profile" className="mt-0 space-y-6 w-full">
            {isAuthenticated && (
              <div>
                <h2 className="text-2xl font-semibold mb-4">Profil</h2>
                <ProfileSettings />
              </div>
            )}
            
            <Separator className="my-6" />
            
            <div>
              <h2 className="text-2xl font-semibold mb-4">Darstellung</h2>
              <Card className="w-full">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex flex-col">
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
                </CardContent>
              </Card>
            </div>
            
            <Separator className="my-6" />
            
            <div>
              <h2 className="text-2xl font-semibold mb-4">Quick Phrases</h2>
              <Card className="w-full">
                <CardContent className="pt-6">
                  <QuickPhrases />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Project Settings Tab */}
          <TabsContent value="project" className="mt-0 space-y-6 w-full">
            {currentProject ? (
              <>
                <div>
                  <h2 className="text-2xl font-semibold mb-4">Projektdetails</h2>
                  <ProjectSettings />
                </div>
                
                <Separator className="my-6" />
                
                <div>
                  <h2 className="text-2xl font-semibold mb-4">Projektmitglieder</h2>
                  <Card className="w-full">
                    <CardContent className="pt-6">
                      <ProjectMembers />
                    </CardContent>
                  </Card>
                </div>
              </>
            ) : (
              <Card className="w-full">
                <CardContent className="py-8 text-center">
                  <SettingsIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Kein Projekt ausgewählt</h3>
                  <p className="text-muted-foreground mb-4">
                    Wähle ein Projekt, um die Projekteinstellungen zu bearbeiten
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
};

export default Settings;
