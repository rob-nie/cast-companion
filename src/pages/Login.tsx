import { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
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
import { Eye, EyeOff, LogIn } from "lucide-react";
import { useUser } from "@/context/UserContext";
import { toast } from "sonner";
import LoadingScreen from "@/components/auth/LoadingScreen";

const formSchema = z.object({
  email: z.string().email("Ungültige E-Mail-Adresse"),
  password: z.string().min(6, "Passwort muss mindestens 6 Zeichen lang sein"),
});

type FormValues = z.infer<typeof formSchema>;

const Login = () => {
  const { login, isLoading, isAuthenticated, user } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Get the intended destination from state, or default to projects
  const from = (location.state as any)?.from?.pathname || "/projects";
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Redirect already authenticated users
  useEffect(() => {
    if (isAuthenticated && user && !isLoading) {
      console.log("User already authenticated, redirecting to:", from);
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, user, isLoading, navigate, from]);

  const onSubmit = async (values: FormValues) => {
    if (submitting) return;
    
    setSubmitting(true);
    try {
      await login(values.email, values.password);
      console.log("Login successful, navigating to:", from);
      
      // Small delay to ensure auth state is fully processed
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 500);
    } catch (error) {
      console.error("Login failed:", error);
      setSubmitting(false);
      // Error is already handled in the AuthContext
    }
  };

  console.log("Login rendering - isAuthenticated:", isAuthenticated, "isLoading:", isLoading, "user:", user);

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
          <h1 className="text-3xl font-bold tracking-tight">Anmelden</h1>
          <p className="mt-2 text-muted-foreground">
            Melde dich an, um auf deine Projekte zuzugreifen
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                        autoComplete="current-password"
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

            <Button
              type="submit"
              className="w-full"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <div className="flex items-center">
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
                  Anmelden...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <LogIn className="mr-2 h-4 w-4" />
                  Anmelden
                </div>
              )}
            </Button>
          </form>
        </Form>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Noch kein Konto?{" "}
            <Link
              to="/register"
              className="font-medium text-primary hover:underline"
            >
              Registrieren
            </Link>
          </p>
          <p className="mt-4 text-xs text-muted-foreground">
            Demo-Benutzer: demo@example.com / password123
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
