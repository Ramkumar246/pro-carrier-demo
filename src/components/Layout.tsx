import { ReactNode, useState, cloneElement, isValidElement } from "react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [isLayoutExpanded, setIsLayoutExpanded] = useState(false);

  const enhancedChildren = isValidElement(children)
    ? cloneElement(children, { isLayoutExpanded })
    : children;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      <div className="ml-16 flex flex-col">
        <TopBar isExpanded={isLayoutExpanded} onToggleLayout={() => setIsLayoutExpanded(!isLayoutExpanded)} />
        
        <main className="p-6">
          {enhancedChildren}
        </main>
      </div>
    </div>
  );
};

export default Layout;

