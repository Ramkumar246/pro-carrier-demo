import { Grid3x3 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface TopBarProps {
  isExpanded: boolean;
  onToggleLayout: () => void;
}

const TopBar = ({ isExpanded, onToggleLayout }: TopBarProps) => {
  return (
    <div className="h-16 bg-card border-b border-border flex items-center justify-end px-6 gap-3">
      <button 
        onClick={onToggleLayout}
        className={`w-10 h-10 rounded-lg flex items-center justify-center hover:bg-muted transition-all ${isExpanded ? 'bg-primary text-primary-foreground' : ''}`}
        title="Toggle chart layout"
      >
        <Grid3x3 className="w-5 h-5" />
      </button>
      <Avatar className="w-10 h-10 bg-accent border border-border">
        <AvatarFallback className="bg-accent text-accent-foreground font-semibold">PR</AvatarFallback>
      </Avatar>
    </div>
  );
};

export default TopBar;
