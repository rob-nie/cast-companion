
import { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useTheme } from "@/context/ThemeContext";
import { useUser } from "@/context/UserContext";
import { useProjects } from "@/context/ProjectContext";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Moon, Sun, Menu, Settings, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const { theme, setTheme } = useTheme();
  const { user, isAuthenticated, logout } = useUser();
  const { selectedProject } = useProjects();
  const location = useLocation();
  const isProjectsPage = location.pathname === "/projects";

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <header className="bg-background sticky top-0 z-50 w-full border-b">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Brand */}
          <Link to="/" className="flex items-center space-x-2 font-semibold">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/logo.png" alt="Cast Companion Logo" />
              <AvatarFallback>CC</AvatarFallback>
            </Avatar>
            <span>CastCompanion</span>
          </Link>

          {/* Projects Button */}
          <NavLink to="/projects">
            <Button 
              variant={isProjectsPage ? "default" : "outline"} 
              size="sm"
            >
              Projekte
            </Button>
          </NavLink>

          {/* Current Project Title */}
          {selectedProject && (
            <div className="ml-4 text-sm font-medium text-foreground/80">
              {selectedProject.title}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Theme Toggle Button */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleTheme} 
            title={theme === "light" ? "Dunkelmodus aktivieren" : "Hellmodus aktivieren"}
          >
            {theme === "light" ? (
              <Moon className="h-[1.2rem] w-[1.2rem]" />
            ) : (
              <Sun className="h-[1.2rem] w-[1.2rem]" />
            )}
            <span className="sr-only">
              {theme === "light" ? "Dunkelmodus aktivieren" : "Hellmodus aktivieren"}
            </span>
          </Button>

          {/* User Menu */}
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.avatar || ""} alt={user?.name || "Profil"} />
                    <AvatarFallback>{user?.name?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <Link to="/settings">
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Einstellungen</span>
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Abmelden</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/login">
              <Button variant="outline" size="sm">
                Anmelden
              </Button>
            </Link>
          )}

          {/* Mobile navigation */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="sm" className="px-2">
                <Menu className="h-4 w-4" />
                <span className="sr-only">Menü</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="sm:max-w-sm">
              <SheetHeader className="text-left">
                <SheetTitle>Navigation</SheetTitle>
                <SheetDescription>
                  Erkunde die Cast Companion App
                </SheetDescription>
              </SheetHeader>
              <nav className="grid gap-4 text-lg font-medium mt-6">
                <SheetClose asChild>
                  <NavLink 
                    to="/projects"
                    className="flex items-center space-x-2 rounded-md p-2 hover:bg-secondary"
                  >
                    <span>Projekte</span>
                  </NavLink>
                </SheetClose>
                {isAuthenticated && (
                  <SheetClose asChild>
                    <Link to="/settings">
                      <Button variant="ghost" className="justify-start w-full">
                        <Settings className="mr-2 h-4 w-4" />
                        Einstellungen
                      </Button>
                    </Link>
                  </SheetClose>
                )}
                {isAuthenticated ? (
                  <SheetClose asChild>
                    <Button variant="ghost" className="justify-start w-full" onClick={logout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Abmelden
                    </Button>
                  </SheetClose>
                ) : (
                  <SheetClose asChild>
                    <Link to="/login">
                      <Button variant="ghost" className="justify-start w-full">
                        Anmelden
                      </Button>
                    </Link>
                  </SheetClose>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
