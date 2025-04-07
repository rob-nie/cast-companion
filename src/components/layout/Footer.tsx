
import { useAuth } from "@/context/AuthContext";

const Footer = () => {
  const { user } = useAuth();

  return (
    <footer className="border-t py-2 px-4 text-center text-xs text-muted-foreground">
      <div className="container flex justify-between items-center">
        <span>© 2025 CastCompanion</span>
        {user && (
          <span>
            User-ID: <code className="bg-muted px-1 py-0.5 rounded">{user.id}</code>
          </span>
        )}
      </div>
    </footer>
  );
};

export default Footer;
