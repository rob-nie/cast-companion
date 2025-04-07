
import { useState } from "react";
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
import { useAuth } from "@/context/AuthContext";

const formSchema = z.object({
  email: z.string().email("Ungültige E-Mail-Adresse"),
  password: z.string().min(6, "Passwort muss mindestens 6 Zeichen lang sein"),
});

type FormValues = z.infer<typeof formSchema>;

const Login = () => {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Immer zur Projekteübersicht nach der Anmeldung weiterleiten
  const from = "/projects";
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      setSubmitting(true);
      await login(values.email, values.password);
      navigate(from, { replace: true });
    } catch (error) {
      // Error is already handled in the AuthContext
      console.error("Login failed:", error);
    } finally {
      setSubmitting(false);
    }
  };

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
                    <Input placeholder="email@example.com" {...field} />
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
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full"
                        onClick={() => setShowPassword(!showPassword)}
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
              disabled={submitting}
            >
              {submitting ? (
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
