import React, { useState } from 'react';
import VesselMap from './VesselMap';
import ShipmentSidebar from './ShipmentSidebar';
import ContainerDetails from './ContainerDetails';
import type { Shipment } from '@/types/shipment';

interface Container {
  id: string;
  number: string;
  type: string;
  weight: string;
}

interface VesselData {
  id: string;
  name: string;
  position: [number, number];
  containers: Container[];
}

interface SegmentData {
  distance: string;
  emissions: string;
  cost: number;
  travelTime: number;
}

interface VesselFinderIndexProps {
  activeShipment?: Shipment | null;
}

const VesselFinderIndex: React.FC<VesselFinderIndexProps> = ({ activeShipment }) => {
  const [selectedContainer, setSelectedContainer] = useState<Container | null>(null);
  const [selectedVesselName, setSelectedVesselName] = useState<string>('');
  const [sidebarMode, setSidebarMode] = useState<'default' | 'supplier' | 'buyer'>('default');
  const [segmentData, setSegmentData] = useState<SegmentData | null>(null);
  const [voyageSummary, setVoyageSummary] = useState<{
    status: string;
    location: string;
    vesselName: string;
    etaDate: string;
    etaTime: string;
    lastPort: string;
    nextPort: string;
    cargo: string;
    timelinessStatus: 'on-time' | 'delayed' | 'unknown';
    timelinessLabel: string;
    voyageMilestones: {
      id: string;
      label: string;
      location: string;
      statusLabel: string;
      status: 'completed' | 'scheduled' | 'delayed' | 'pending';
      date: string;
    }[];
    transitDays: number;
    transitDaysRemaining: number;
  } | null>(null);

  const handleContainerClick = (container: Container, vessel: VesselData) => {
    setSelectedContainer(container);
    setSelectedVesselName(vessel.name);
  };

  const isAirMode = activeShipment?.transportMode === 'Air';

  return (
    <div className="flex h-screen bg-background">
      {selectedContainer ? (
        <ContainerDetails
          container={selectedContainer}
          vesselName={selectedVesselName}
          onClose={() => setSelectedContainer(null)}
        />
      ) : (
        <ShipmentSidebar
          mode={sidebarMode}
          onModeChange={setSidebarMode}
          segmentData={segmentData}
          voyageSummary={voyageSummary}
          isAirMode={isAirMode}
        />
      )}
      <div className="flex-1 relative">
        <VesselMap
          activeShipment={activeShipment}
          onContainerClick={handleContainerClick}
          onAddressViewChange={setSidebarMode}
          onSegmentDataChange={setSegmentData}
          onVoyageSummaryChange={setVoyageSummary}
        />
      </div>
    </div>
  );
};

export default VesselFinderIndex;

