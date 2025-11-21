import VesselFinderIndex from "@/components/external/VesselFinderIndex";
import Sidebar from "@/components/Sidebar";

/**
 * Vessel Finder Page
 * 
 * This page hosts the Vessel Finder application integrated from the external repository.
 * Uses full-screen layout without TopBar to match the original design.
 */

const ExternalPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="ml-16">
        <VesselFinderIndex />
      </div>
    </div>
  );
};

export default ExternalPage;

