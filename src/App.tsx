
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/context/ThemeContext";
import { ProjectProvider } from "@/context/ProjectContext";
import { NotesProvider } from "@/context/NotesContext";
import { MessagesProvider } from "@/context/MessagesContext";
import { WatchProvider } from "@/context/WatchContext";
import { UserProvider } from "@/context/UserContext";
import AuthGuard from "@/components/auth/AuthGuard";

// Pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Projects from "./pages/Projects";
import InterviewDashboard from "./pages/InterviewDashboard";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import ProjectSharing from "./pages/ProjectSharing";
import DatabaseRules from "./pages/DatabaseRules";
import Debug from "./pages/Debug";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <UserProvider>
        <ProjectProvider>
          <NotesProvider>
            <MessagesProvider>
              <WatchProvider>
                <TooltipProvider>
                  <Toaster />
                  <Sonner />
                  <BrowserRouter>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />
                      
                      {/* Protected routes */}
                      <Route element={<AuthGuard />}>
                        <Route path="/projects" element={<Projects />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/dashboard" element={<InterviewDashboard />} />
                        <Route path="/project-sharing" element={<ProjectSharing />} />
                        <Route path="/database-rules" element={<DatabaseRules />} />
                        <Route path="/debug" element={<Debug />} />
                      </Route>
                      
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </BrowserRouter>
                </TooltipProvider>
              </WatchProvider>
            </MessagesProvider>
          </NotesProvider>
        </ProjectProvider>
      </UserProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
