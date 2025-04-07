
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { UserPlus } from "lucide-react";
import { useState, ReactNode } from "react";

const emailFormSchema = z.object({
  email: z.string().email("Ungültige E-Mail-Adresse"),
  role: z.enum(["editor", "viewer"]),
});

const userIdFormSchema = z.object({
  userId: z.string().min(5, "Benutzer-ID muss mindestens 5 Zeichen haben"),
  role: z.enum(["editor", "viewer"]),
});

type EmailFormValues = z.infer<typeof emailFormSchema>;
type UserIdFormValues = z.infer<typeof userIdFormSchema>;

type AddMemberDialogProps = {
  onAddMember: (email: string, role: "editor" | "viewer") => Promise<void>;
  onAddMemberById?: (userId: string, role: "editor" | "viewer") => Promise<void>;
  children?: ReactNode;
};

const AddMemberDialog = ({ onAddMember, onAddMemberById, children }: AddMemberDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"email" | "userId">("email");
  
  const emailForm = useForm<EmailFormValues>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      email: "",
      role: "editor",
    },
  });
  
  const userIdForm = useForm<UserIdFormValues>({
    resolver: zodResolver(userIdFormSchema),
    defaultValues: {
      userId: "",
      role: "editor",
    },
  });
  
  const handleInviteByEmail = async (values: EmailFormValues) => {
    try {
      setIsLoading(true);
      await onAddMember(values.email, values.role);
      emailForm.reset();
      setIsOpen(false);
    } catch (error: any) {
      console.error("Failed to add member by email:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInviteByUserId = async (values: UserIdFormValues) => {
    try {
      if (!onAddMemberById) {
        console.error("onAddMemberById function not provided");
        return;
      }
      
      setIsLoading(true);
      await onAddMemberById(values.userId, values.role);
      userIdForm.reset();
      setIsOpen(false);
    } catch (error: any) {
      console.error("Failed to add member by userId:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value as "email" | "userId");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button size="sm" className="gap-1">
            <UserPlus className="h-4 w-4" />
            Einladen
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Neues Mitglied einladen</DialogTitle>
          <DialogDescription>
            Füge einen Benutzer per E-Mail oder Benutzer-ID hinzu
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="email" value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email">Per E-Mail</TabsTrigger>
            <TabsTrigger value="userId" disabled={!onAddMemberById}>Per Benutzer-ID</TabsTrigger>
          </TabsList>
          
          <TabsContent value="email">
            <Form {...emailForm}>
              <form onSubmit={emailForm.handleSubmit(handleInviteByEmail)} className="space-y-4 pt-2">
                <FormField
                  control={emailForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-Mail</FormLabel>
                      <FormControl>
                        <Input placeholder="email@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={emailForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rolle</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Rolle auswählen" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="editor">Bearbeiter</SelectItem>
                          <SelectItem value="viewer">Betrachter</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
                      Einladen...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <UserPlus className="mr-2 h-4 w-4" />
                      Mitglied einladen
                    </div>
                  )}
                </Button>
              </form>
            </Form>
          </TabsContent>
          
          <TabsContent value="userId">
            <Form {...userIdForm}>
              <form onSubmit={userIdForm.handleSubmit(handleInviteByUserId)} className="space-y-4 pt-2">
                <FormField
                  control={userIdForm.control}
                  name="userId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Benutzer-ID</FormLabel>
                      <FormControl>
                        <Input placeholder="user123abc" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={userIdForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rolle</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Rolle auswählen" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="editor">Bearbeiter</SelectItem>
                          <SelectItem value="viewer">Betrachter</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
                      Einladen...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <UserPlus className="mr-2 h-4 w-4" />
                      Mitglied einladen
                    </div>
                  )}
                </Button>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AddMemberDialog;
