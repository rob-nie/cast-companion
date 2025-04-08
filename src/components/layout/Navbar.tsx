import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useTheme } from "@/context/ThemeContext";
import { useUser } from "@/context/UserContext";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ModeToggle } from "@/components/ModeToggle";
import { navigation } from "@/data/navigation";
import { Menu, X, LogOut } from "lucide-react";

const Navbar = () => {
  const { theme } = useTheme();
  const { user, isAuthenticated, logout } = useUser();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="bg-background sticky top-0 z-50 w-full border-b">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center space-x-2 font-semibold">
          <Avatar className="h-8 w-8">
            <AvatarImage src="/logo.png" alt="Cast Companion Logo" />
            <AvatarFallback>CC</AvatarFallback>
          </Avatar>
          <span>Cast Companion</span>
        </Link>

        <nav className="hidden md:flex items-center space-x-6">
          {navigation.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                `text-sm font-medium transition-colors hover:text-foreground/80 ${
                  isActive ? "text-foreground" : "text-foreground/60"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center space-x-2">
          <ModeToggle />
          {isAuthenticated ? (
            <>
              <Link to="/settings">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.photoURL || ""} alt={user?.displayName || "Profile"} />
                  <AvatarFallback>{user?.displayName?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                </Avatar>
              </Link>
              <Button variant="outline" size="sm" onClick={logout} className="hidden md:block">
                Abmelden
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="outline" size="sm" className="hidden md:block">
                  Anmelden
                </Button>
              </Link>
            </>
          )}

          {/* Mobile navigation */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="sm" className="px-2">
                {isMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
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
              <nav className="grid gap-4 text-lg font-medium">
                {navigation.map((item) => (
                  <SheetClose asChild key={item.href}>
                    <NavLink
                      to={item.href}
                      className={({ isActive }) =>
                        `flex items-center space-x-2 rounded-md p-2 hover:bg-secondary ${
                          isActive ? "text-foreground" : "text-foreground/60"
                        }`
                      }
                    >
                      <span>{item.label}</span>
                    </NavLink>
                  </SheetClose>
                ))}
                {isAuthenticated && (
                  <SheetClose asChild>
                    <Link to="/settings">
                      <Button variant="ghost" className="justify-start">
                        Einstellungen
                      </Button>
                    </Link>
                  </SheetClose>
                )}
                {isAuthenticated ? (
                  <SheetClose asChild>
                    <Button variant="ghost" className="justify-start" onClick={logout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Abmelden
                    </Button>
                  </SheetClose>
                ) : (
                  <SheetClose asChild>
                    <Link to="/login">
                      <Button variant="ghost" className="justify-start">
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
