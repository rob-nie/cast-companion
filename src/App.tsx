
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

// Pages
import Index from "./pages/Index";
import Projects from "./pages/Projects";
import InterviewDashboard from "./pages/InterviewDashboard";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
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
                    <Route path="/projects" element={<Projects />} />
                    <Route path="/dashboard" element={<InterviewDashboard />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </BrowserRouter>
              </TooltipProvider>
            </WatchProvider>
          </MessagesProvider>
        </NotesProvider>
      </ProjectProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
