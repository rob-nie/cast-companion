
import { Search, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ProjectsSearchProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  isLoading: boolean;
  onRefresh: () => void;
}

const ProjectsSearch = ({ searchTerm, setSearchTerm, isLoading, onRefresh }: ProjectsSearchProps) => {
  return (
    <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
      <div className="relative flex-1 w-full">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Projekte durchsuchen..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-8"
        />
      </div>
      {isLoading ? (
        <Button variant="outline" disabled className="whitespace-nowrap">
          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          Lädt...
        </Button>
      ) : (
        <Button variant="outline" onClick={onRefresh} className="whitespace-nowrap">
          <RefreshCw className="h-4 w-4 mr-2" />
          Aktualisieren
        </Button>
      )}
    </div>
  );
};

export default ProjectsSearch;
