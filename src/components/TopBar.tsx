import { Grid3x3, Bell, HelpCircle } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface TopBarProps {
  isExpanded: boolean;
  onToggleLayout: () => void;
  onOpenTour?: () => void;
}

const TopBar = ({ isExpanded, onToggleLayout, onOpenTour }: TopBarProps) => {
  return (
    <div 
      className="h-16 bg-card border-b border-border flex items-center justify-end px-6 gap-2"
      data-tour-id="tour-topbar"
    >
      {/* Quick tour trigger */}
      {onOpenTour && (
        <button
          type="button"
          onClick={onOpenTour}
          className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-muted transition-all text-muted-foreground hover:text-foreground"
          title="Take a quick tour"
        >
          <HelpCircle className="w-5 h-5" />
        </button>
      )}

      {/* Notifications */}
      <button 
        className="relative w-10 h-10 rounded-lg flex items-center justify-center hover:bg-muted transition-all text-muted-foreground hover:text-foreground"
        title="Notifications"
        data-tour-id="tour-notifications"
      >
        <Bell className="w-5 h-5" />
        <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full" />
      </button>

      {/* Layout toggle */}
      <button 
        onClick={onToggleLayout}
        className={`w-10 h-10 rounded-lg flex items-center justify-center hover:bg-muted transition-all ${isExpanded ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        title="Toggle dashboard view"
        data-tour-id="tour-layout-toggle"
      >
        <Grid3x3 className="w-5 h-5" />
      </button>

      {/* Profile avatar */}
      <button
        className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-full"
        title="Profile settings"
        data-tour-id="tour-profile"
      >
        <Avatar className="w-10 h-10 bg-accent border border-border cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all">
          <AvatarFallback className="bg-accent text-accent-foreground font-semibold">PR</AvatarFallback>
        </Avatar>
      </button>
    </div>
  );
};

export default TopBar;
