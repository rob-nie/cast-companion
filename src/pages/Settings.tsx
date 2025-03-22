
import PageLayout from "@/components/layout/PageLayout";
import QuickPhrases from "@/components/settings/QuickPhrases";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/context/ThemeContext";

const Settings = () => {
  const { theme, setTheme } = useTheme();

  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Customize your interview experience
          </p>
        </div>

        <Tabs defaultValue="appearance" className="w-full">
          <TabsList className="w-full max-w-md mb-6">
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="quick-phrases" className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              <span>Quick Phrases</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="appearance" className="mt-0">
            <div className="space-y-4">
              <div className="flex flex-col">
                <h2 className="text-xl font-semibold mb-1">Theme</h2>
                <p className="text-muted-foreground mb-4">
                  Choose your preferred appearance mode
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
                        Clean, bright appearance
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
                        Reduced brightness, easier on the eyes
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
        </Tabs>
      </div>
    </PageLayout>
  );
};

export default Settings;
