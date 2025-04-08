
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
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
import { Eye, EyeOff, UserPlus } from "lucide-react";
import { useUser } from "@/context/UserContext";
import LoadingScreen from "@/components/auth/LoadingScreen";

const formSchema = z.object({
  name: z.string().min(2, "Name muss mindestens 2 Zeichen lang sein"),
  email: z.string().email("Ungültige E-Mail-Adresse"),
  password: z.string().min(6, "Passwort muss mindestens 6 Zeichen lang sein"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwörter stimmen nicht überein",
  path: ["confirmPassword"],
});

type FormValues = z.infer<typeof formSchema>;

const Register = () => {
  const { register, isLoading, isAuthenticated, user } = useUser();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Redirect already authenticated users
  useEffect(() => {
    if (isAuthenticated && user && !isLoading) {
      console.log("User already authenticated, redirecting to projects");
      navigate("/projects", { replace: true });
    }
  }, [isAuthenticated, user, isLoading, navigate]);

  const onSubmit = async (values: FormValues) => {
    if (submitting) return;
    
    setSubmitting(true);
    try {
      await register(values.name, values.email, values.password);
      
      // Small delay to ensure auth state is fully processed
      setTimeout(() => {
        navigate("/projects", { replace: true });
      }, 500);
    } catch (error) {
      console.error("Registration failed:", error);
      setSubmitting(false);
      // Error is already handled in the UserContext
    }
  };

  console.log("Register rendering - isAuthenticated:", isAuthenticated, "isLoading:", isLoading, "user:", user);

  // Don't render the form if user is already authenticated
  if (isAuthenticated && user && !submitting) {
    return <LoadingScreen />;
  }

  // Determine if we should show loading state
  const isProcessing = isLoading || submitting;

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Registrieren</h1>
          <p className="mt-2 text-muted-foreground">
            Erstelle ein Konto, um mit der Verwaltung deiner Projekte zu beginnen
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Max Mustermann" 
                      autoComplete="name"
                      {...field} 
                      disabled={isProcessing} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-Mail</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="email@example.com" 
                      autoComplete="email"
                      {...field} 
                      disabled={isProcessing} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Passwort</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="******"
                        autoComplete="new-password"
                        {...field}
                        disabled={isProcessing}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isProcessing}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Passwort bestätigen</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="******" 
                      autoComplete="new-password"
                      {...field} 
                      disabled={isProcessing} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <div className="flex items-center">
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
                  Registrieren...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Registrieren
                </div>
              )}
            </Button>
          </form>
        </Form>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Bereits ein Konto?{" "}
            <Link
              to="/login"
              className="font-medium text-primary hover:underline"
            >
              Anmelden
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
