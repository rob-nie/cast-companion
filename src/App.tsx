
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/context/ThemeContext";
import { UserProvider } from "@/context/UserContext";
import { ProjectManagementProvider } from "@/context/projectManagement";
import { ProjectProvider } from "@/context/ProjectContext";
import { NotesProvider } from "@/context/notes";
import { MessagesProvider } from "@/context/messages";
import { WatchProvider } from "@/context/watch";
import { ProjectMembersProvider } from "@/context/projectMembers";
import { ProjectSharingProvider } from "@/context/projectSharing";
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

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <UserProvider>
        <BrowserRouter>
          <ProjectManagementProvider>
            <ProjectProvider>
              <ProjectMembersProvider>
                <ProjectSharingProvider>
                  <NotesProvider>
                    <MessagesProvider>
                      <WatchProvider>
                        <TooltipProvider>
                          <Toaster />
                          <Sonner position="top-right" />
                          <Routes>
                            <Route path="/" element={<Index />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />
                            <Route path="/debug" element={<Debug />} />
                            <Route path="/database-rules" element={<DatabaseRules />} />
                            
                            {/* Protected routes */}
                            <Route element={<AuthGuard />}>
                              <Route path="/projects" element={<Projects />} />
                              <Route path="/settings" element={<Settings />} />
                              <Route path="/dashboard" element={<InterviewDashboard />} />
                              <Route path="/project-sharing" element={<ProjectSharing />} />
                            </Route>
                            
                            <Route path="*" element={<NotFound />} />
                          </Routes>
                        </TooltipProvider>
                      </WatchProvider>
                    </MessagesProvider>
                  </NotesProvider>
                </ProjectSharingProvider>
              </ProjectMembersProvider>
            </ProjectProvider>
          </ProjectManagementProvider>
        </BrowserRouter>
      </UserProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
