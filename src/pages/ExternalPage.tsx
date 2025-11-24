import VesselFinderIndex from "@/components/external/VesselFinderIndex";
import Sidebar from "@/components/Sidebar";
import { useLocation } from "react-router-dom";
import type { Shipment } from "@/types/shipment";

/**
 * Vessel Finder Page
 * 
 * This page hosts the Vessel Finder application integrated from the external repository.
 * Uses full-screen layout without TopBar to match the original design.
 */

const ExternalPage = () => {
  const location = useLocation();
  const state = location.state as { shipment?: Shipment } | undefined;
  const activeShipment = state?.shipment;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="ml-16">
        <VesselFinderIndex activeShipment={activeShipment} />
      </div>
    </div>
  );
};

export default ExternalPage;

