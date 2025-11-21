import { ReactNode, useState } from "react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [isLayoutExpanded, setIsLayoutExpanded] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      <div className="ml-16 flex flex-col">
        <TopBar isExpanded={isLayoutExpanded} onToggleLayout={() => setIsLayoutExpanded(!isLayoutExpanded)} />
        
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;

