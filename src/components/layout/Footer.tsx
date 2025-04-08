
import { Link } from "react-router-dom";
import { useUser } from "@/context/UserContext";

const Footer = () => {
  const { user } = useUser();

  return (
    <footer className="border-t py-4 px-6">
      <div className="container flex flex-col md:flex-row justify-between items-center text-xs text-muted-foreground">
        <div>
          &copy; {new Date().getFullYear()} Cast Companion
        </div>
        <div className="flex items-center space-x-3 mt-2 md:mt-0">
          <Link to="/debug" className="hover:text-foreground transition-colors">
            Debug
          </Link>
          {user && (
            <div>
              Benutzer-ID: <span className="font-mono bg-muted p-1 rounded">{user.id}</span>
            </div>
          )}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
