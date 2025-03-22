
import { Link, useLocation } from "react-router-dom";
import { Moon, Sun, Users, Settings } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useProjects } from "@/context/ProjectContext";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const { theme, setTheme } = useTheme();
  const { currentProject } = useProjects();
  const location = useLocation();

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <header className="border-b border-border/40 bg-background/80 backdrop-blur-sm">
      <div className="container flex h-16 items-center justify-between py-4">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl font-medium tracking-tight">InterviewSync</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6">
            <Link 
              to="/projects" 
              className={`text-sm font-medium transition-colors hover:text-primary ${
                location.pathname === "/projects" ? "text-primary" : "text-foreground/70"
              }`}
            >
              Projects
            </Link>
            
            {currentProject && (
              <Link 
                to="/dashboard" 
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  location.pathname === "/dashboard" ? "text-primary" : "text-foreground/70"
                }`}
              >
                Dashboard
              </Link>
            )}
          </nav>
        </div>
        
        <div className="flex items-center gap-2">
          {currentProject && (
            <span className="hidden sm:inline-block mr-4 text-sm font-medium text-muted-foreground">
              Current: {currentProject.title}
            </span>
          )}
          
          <Link to="/settings">
            <Button variant="ghost" size="icon" className="focus-ring">
              <Settings className="h-5 w-5" />
              <span className="sr-only">Settings</span>
            </Button>
          </Link>
          
          <Button onClick={toggleTheme} variant="ghost" size="icon" className="focus-ring">
            {theme === "light" ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
