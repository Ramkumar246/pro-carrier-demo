import { ReactNode, useState, cloneElement, isValidElement } from "react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import QuickTour from "@/components/QuickTour";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [isLayoutExpanded, setIsLayoutExpanded] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);

  const enhancedChildren = isValidElement(children)
    ? cloneElement(children, { isLayoutExpanded })
    : children;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <QuickTour isOpen={isTourOpen} onClose={() => setIsTourOpen(false)} />

      <div className="ml-16 flex flex-col">
        <TopBar
          isExpanded={isLayoutExpanded}
          onToggleLayout={() => setIsLayoutExpanded(!isLayoutExpanded)}
          onOpenTour={() => setIsTourOpen(true)}
        />
        
        <main className="p-6">
          {enhancedChildren}
        </main>
      </div>
    </div>
  );
};

export default Layout;

