
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useProjects } from "@/context/ProjectContext";
import { Pencil, Save } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const formSchema = z.object({
  title: z.string().min(2, "Titel muss mindestens 2 Zeichen lang sein"),
  description: z.string().min(5, "Beschreibung muss mindestens 5 Zeichen lang sein"),
});

const ProjectSettings = () => {
  const { currentProject, updateProject } = useProjects();
  const [isEditing, setIsEditing] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: currentProject?.title || "",
      description: currentProject?.description || "",
    },
  });
  
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (currentProject) {
        await updateProject(currentProject.id, values);
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Project update failed:", error);
    }
  };
  
  if (!currentProject) {
    return null;
  }
  
  return (
    <Card>
      <CardContent className="pt-6">
        {!isEditing ? (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Projekttitel</h3>
              <p className="text-lg font-medium">{currentProject.title}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Beschreibung</h3>
              <p className="text-md">{currentProject.description}</p>
            </div>
            
            <Button 
              onClick={() => setIsEditing(true)} 
              variant="outline" 
              className="flex items-center gap-2"
            >
              <Pencil className="h-4 w-4" />
              Projekt bearbeiten
            </Button>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Projekttitel</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Beschreibung</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        rows={4} 
                        placeholder="Beschreibe dein Projekt..." 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex gap-2">
                <Button 
                  type="submit"
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  Speichern
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditing(false)}
                >
                  Abbrechen
                </Button>
              </div>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectSettings;
