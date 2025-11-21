import { LayoutDashboard, Package, TrendingUp, Settings, LogOut, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { NavLink, useLocation } from "react-router-dom";

const Sidebar = () => {
  const location = useLocation();
  
  const navItems = [
    { icon: LayoutDashboard, path: "/", label: "Dashboard" },
    { icon: Package, path: "/shipments", label: "Shipments" },
    { icon: FileText, path: "/external-page", label: "External Page" },
  ];

  return (
    <div className="w-16 bg-sidebar border-r border-sidebar-border flex flex-col items-center py-6 fixed left-0 top-0 bottom-0 z-50">
      {/* Logo */}
      <div className="mb-8">
        <NavLink to="/" className="block">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
            <Package className="w-6 h-6 text-white" />
          </div>
        </NavLink>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              title={item.label}
              className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="w-5 h-5" />
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="flex flex-col gap-4">
        <button className="w-10 h-10 rounded-lg flex items-center justify-center text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200">
          <Settings className="w-5 h-5" />
        </button>
        <button className="w-10 h-10 rounded-lg flex items-center justify-center text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200">
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
