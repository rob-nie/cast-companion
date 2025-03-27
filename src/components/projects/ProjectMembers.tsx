
import { useState } from "react";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserPlus, Users, UserX, Shield, Edit } from "lucide-react";
import { useUser, ProjectMember } from "@/context/UserContext";
import { useProjects } from "@/context/ProjectContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const formSchema = z.object({
  email: z.string().email("Ungültige E-Mail-Adresse"),
  role: z.enum(["editor", "viewer"]),
});

type FormValues = z.infer<typeof formSchema>;

const ProjectMembers = () => {
  const { currentProject } = useProjects();
  const { user, getProjectMembers, addProjectMember, removeProjectMember, updateProjectMemberRole } = useUser();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      role: "editor",
    },
  });
  
  if (!currentProject || !user) {
    return null;
  }
  
  const members = getProjectMembers(currentProject.id);
  const currentUserMember = members.find(m => m.userId === user.id);
  const isOwner = currentUserMember?.role === "owner";
  
  const handleInvite = async (values: FormValues) => {
    try {
      setIsLoading(true);
      await addProjectMember(currentProject.id, values.email, values.role);
      form.reset();
      setIsAddOpen(false);
    } catch (error) {
      console.error("Failed to add member:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRemoveMember = async (memberId: string) => {
    try {
      await removeProjectMember(currentProject.id, memberId);
    } catch (error) {
      console.error("Failed to remove member:", error);
    }
  };
  
  const handleUpdateRole = async (memberId: string, newRole: "owner" | "editor" | "viewer") => {
    try {
      await updateProjectMemberRole(currentProject.id, memberId, newRole);
    } catch (error) {
      console.error("Failed to update role:", error);
    }
  };
  
  const getRoleBadgeClass = (role: string) => {
    switch(role) {
      case "owner": return "bg-primary text-primary-foreground";
      case "editor": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
      case "viewer": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100";
    }
  };
  
  const getRoleLabel = (role: string) => {
    switch(role) {
      case "owner": return "Inhaber";
      case "editor": return "Bearbeiter";
      case "viewer": return "Betrachter";
      default: return role;
    }
  };
  
  const getRoleIcon = (role: string) => {
    switch(role) {
      case "owner": return <Shield className="h-3 w-3" />;
      case "editor": return <Edit className="h-3 w-3" />;
      case "viewer": return null;
      default: return null;
    }
  };
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg font-semibold">Projektmitglieder</CardTitle>
            <CardDescription>
              Verwalte Zugriff und Berechtigungen
            </CardDescription>
          </div>
          {isOwner && (
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1">
                  <UserPlus className="h-4 w-4" />
                  Einladen
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Neues Mitglied einladen</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleInvite)} className="space-y-4">
                    <FormField
                      control={form.control}
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
                      control={form.control}
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
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {members.length > 0 ? (
            members.map((member) => (
              <div
                key={member.userId}
                className="flex items-center justify-between p-2 rounded-md hover:bg-muted/40"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={member.avatar} alt={member.name} />
                    <AvatarFallback>
                      {member.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{member.name}</p>
                    <p className="text-xs text-muted-foreground">{member.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeClass(member.role)}`}>
                    {getRoleIcon(member.role)}
                    {getRoleLabel(member.role)}
                  </span>
                  
                  {isOwner && member.userId !== user.id && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Users className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Rolle ändern</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleUpdateRole(member.userId, "editor")}>
                          <Edit className="mr-2 h-4 w-4" />
                          Bearbeiter
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdateRole(member.userId, "viewer")}>
                          <Users className="mr-2 h-4 w-4" />
                          Betrachter
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleRemoveMember(member.userId)}
                        >
                          <UserX className="mr-2 h-4 w-4" />
                          Entfernen
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center p-6 border border-dashed rounded-md">
              <Users className="h-10 w-10 mx-auto text-muted-foreground/60" />
              <p className="mt-2 text-muted-foreground">
                Dieses Projekt hat noch keine Mitglieder
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectMembers;
