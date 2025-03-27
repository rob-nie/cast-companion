
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Moon, Sun, Users, Settings, LogOut } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useProjects } from "@/context/ProjectContext";
import { useUser } from "@/context/UserContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const { theme, setTheme } = useTheme();
  const { currentProject } = useProjects();
  const { user, logout, isAuthenticated } = useUser();
  const location = useLocation();
  const navigate = useNavigate();

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const handleLogout = () => {
    logout();
    navigate("/");
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

          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  {user?.name}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Konto</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Abmelden
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/login">
              <Button variant="default" size="sm">
                Anmelden
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
