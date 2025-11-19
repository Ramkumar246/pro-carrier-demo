import { useState } from "react";
import { Ship, ChevronDown, ChevronUp, MoreVertical } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import DashboardCard from "@/components/DashboardCard";
import CarbonEmissionsChart from "@/components/charts/CarbonEmissionsChart";
import ShipmentVolumesChart from "@/components/charts/ShipmentVolumesChart";
import FreightWeightChart from "@/components/charts/FreightWeightChart";
import ShipmentDistributionChart from "@/components/charts/ShipmentDistributionChart";
import ShipmentMap from "@/components/ShipmentMap";
import ShipmentTable, { type Shipment } from "@/components/ShipmentTable";
import FilterButtons from "@/components/FilterButtons";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";

const inTransitShipments: Shipment[] = [
  {
    id: "PC#2025-084406",
    status: "Out for Delivery",
    origin: "N/A",
    route: "Shanghai → Felixstowe",
    departure: "16/09/2025",
    arrival: "18/10/2025",
    delivery: "18/10/2025",
    tradeParty: "XYZ Shipper China",
    grossWeight: 12800,
    volumeTeu: 4,
    containers: 3,
    costUsd: 82000,
  },
  {
    id: "PC#2025-084407",
    status: "Booked for Delivery",
    origin: "N/A",
    route: "Felixstowe → Auckland",
    departure: "16/09/2025",
    arrival: "20/10/2025",
    delivery: "24/10/2025",
    tradeParty: "ABC Buyer New Zealand",
    grossWeight: 9800,
    volumeTeu: 3,
    containers: 2,
    costUsd: 61000,
  },
  {
    id: "PC#2025-084408",
    status: "Awaiting Arrival",
    origin: "N/A",
    route: "Shanghai → Felixstowe",
    departure: "18/09/2025",
    arrival: "22/10/2025",
    delivery: "24/10/2025",
    tradeParty: "XYZ Shipper China",
    grossWeight: 11250,
    volumeTeu: 3,
    containers: 2,
    costUsd: 70050,
  },
  {
    id: "PC#2025-084409",
    status: "Awaiting Arrival",
    origin: "N/A",
    route: "Felixstowe → Auckland",
    departure: "18/09/2025",
    arrival: "25/10/2025",
    delivery: "27/10/2025",
    tradeParty: "ABC Buyer New Zealand",
    grossWeight: 15000,
    volumeTeu: 5,
    containers: 4,
    costUsd: 98000,
  },
  {
    id: "PC#2025-084410",
    status: "Booked for Delivery",
    origin: "N/A",
    route: "Shanghai → Felixstowe",
    departure: "20/09/2025",
    arrival: "29/10/2025",
    delivery: "30/10/2025",
    tradeParty: "XYZ Shipper China",
    grossWeight: 13200,
    volumeTeu: 4,
    containers: 3,
    costUsd: 86000,
  },
  {
    id: "PC#2025-084411",
    status: "Out for Delivery",
    origin: "N/A",
    route: "Felixstowe → Auckland",
    departure: "22/09/2025",
    arrival: "01/11/2025",
    delivery: "04/11/2025",
    tradeParty: "ABC Buyer New Zealand",
    grossWeight: 10600,
    volumeTeu: 3,
    containers: 2,
    costUsd: 64000,
  },
];

const pendingShipments: Shipment[] = [
  {
    id: "PN#2025-010001",
    status: "Pending Confirmation",
    origin: "N/A",
    route: "Shanghai → Felixstowe",
    departure: "04/10/2025",
    arrival: "12/11/2025",
    delivery: "14/11/2025",
    tradeParty: "XYZ Shipper China",
    grossWeight: 8900,
    volumeTeu: 3,
    containers: 2,
    costUsd: 56000,
  },
  {
    id: "PN#2025-010002",
    status: "Pending Documents",
    origin: "N/A",
    route: "Felixstowe → Auckland",
    departure: "06/10/2025",
    arrival: "16/11/2025",
    delivery: "18/11/2025",
    tradeParty: "ABC Buyer New Zealand",
    grossWeight: 10200,
    volumeTeu: 3,
    containers: 2,
    costUsd: 62000,
  },
  {
    id: "PN#2025-010003",
    status: "Pending Inspection",
    origin: "N/A",
    route: "Shanghai → Felixstowe",
    departure: "10/10/2025",
    arrival: "20/11/2025",
    delivery: "22/11/2025",
    tradeParty: "XYZ Shipper China",
    grossWeight: 9400,
    volumeTeu: 3,
    containers: 2,
    costUsd: 60000,
  },
];

const completedShipments: Shipment[] = [
  {
    id: "CP#2025-000901",
    status: "Delivered",
    origin: "N/A",
    route: "Shanghai → Felixstowe",
    departure: "01/08/2025",
    arrival: "05/09/2025",
    delivery: "06/09/2025",
    tradeParty: "XYZ Shipper China",
    grossWeight: 12000,
    volumeTeu: 4,
    containers: 3,
    costUsd: 78000,
  },
  {
    id: "CP#2025-000902",
    status: "Delivered",
    origin: "N/A",
    route: "Felixstowe → Auckland",
    departure: "05/08/2025",
    arrival: "12/09/2025",
    delivery: "14/09/2025",
    tradeParty: "ABC Buyer New Zealand",
    grossWeight: 13400,
    volumeTeu: 4,
    containers: 3,
    costUsd: 87000,
  },
  {
    id: "CP#2025-000903",
    status: "Delivered",
    origin: "N/A",
    route: "Shanghai → Felixstowe",
    departure: "08/08/2025",
    arrival: "15/09/2025",
    delivery: "16/09/2025",
    tradeParty: "XYZ Shipper China",
    grossWeight: 9900,
    volumeTeu: 3,
    containers: 2,
    costUsd: 65000,
  },
  {
    id: "CP#2025-000904",
    status: "Delivered",
    origin: "N/A",
    route: "Felixstowe → Auckland",
    departure: "12/08/2025",
    arrival: "20/09/2025",
    delivery: "22/09/2025",
    tradeParty: "ABC Buyer New Zealand",
    grossWeight: 14350,
    volumeTeu: 5,
    containers: 4,
    costUsd: 99000,
  },
  {
    id: "CP#2025-000905",
    status: "Delivered",
    origin: "N/A",
    route: "Shanghai → Felixstowe",
    departure: "15/08/2025",
    arrival: "23/09/2025",
    delivery: "24/09/2025",
    tradeParty: "XYZ Shipper China",
    grossWeight: 11800,
    volumeTeu: 4,
    containers: 3,
    costUsd: 82000,
  },
  {
    id: "CP#2025-000906",
    status: "Delivered",
    origin: "N/A",
    route: "Felixstowe → Auckland",
    departure: "18/08/2025",
    arrival: "26/09/2025",
    delivery: "28/09/2025",
    tradeParty: "ABC Buyer New Zealand",
    grossWeight: 12600,
    volumeTeu: 4,
    containers: 3,
    costUsd: 87000,
  },
  {
    id: "CP#2025-000907",
    status: "Delivered",
    origin: "N/A",
    route: "Shanghai → Felixstowe",
    departure: "21/08/2025",
    arrival: "29/09/2025",
    delivery: "30/09/2025",
    tradeParty: "XYZ Shipper China",
    grossWeight: 10100,
    volumeTeu: 3,
    containers: 2,
    costUsd: 64000,
  },
  {
    id: "CP#2025-000908",
    status: "Delivered",
    origin: "N/A",
    route: "Felixstowe → Auckland",
    departure: "24/08/2025",
    arrival: "02/10/2025",
    delivery: "04/10/2025",
    tradeParty: "ABC Buyer New Zealand",
    grossWeight: 13900,
    volumeTeu: 5,
    containers: 4,
    costUsd: 101000,
  },
  {
    id: "CP#2025-000909",
    status: "Delivered",
    origin: "N/A",
    route: "Shanghai → Felixstowe",
    departure: "27/08/2025",
    arrival: "05/10/2025",
    delivery: "06/10/2025",
    tradeParty: "XYZ Shipper China",
    grossWeight: 11500,
    volumeTeu: 4,
    containers: 3,
    costUsd: 79000,
  },
  {
    id: "CP#2025-000910",
    status: "Delivered",
    origin: "N/A",
    route: "Felixstowe → Auckland",
    departure: "30/08/2025",
    arrival: "08/10/2025",
    delivery: "10/10/2025",
    tradeParty: "ABC Buyer New Zealand",
    grossWeight: 13200,
    volumeTeu: 4,
    containers: 3,
    costUsd: 88000,
  },
  {
    id: "CP#2025-000911",
    status: "Delivered",
    origin: "N/A",
    route: "Shanghai → Felixstowe",
    departure: "02/09/2025",
    arrival: "10/10/2025",
    delivery: "12/10/2025",
    tradeParty: "XYZ Shipper China",
    grossWeight: 12300,
    volumeTeu: 4,
    containers: 3,
    costUsd: 84000,
  },
  {
    id: "CP#2025-000912",
    status: "Delivered",
    origin: "N/A",
    route: "Felixstowe → Auckland",
    departure: "05/09/2025",
    arrival: "14/10/2025",
    delivery: "16/10/2025",
    tradeParty: "ABC Buyer New Zealand",
    grossWeight: 13600,
    volumeTeu: 4,
    containers: 3,
    costUsd: 91000,
  },
];

const Index = () => {
  const [inTransitOpen, setInTransitOpen] = useState(true);
  const [pendingOpen, setPendingOpen] = useState(false);
  const [completedOpen, setCompletedOpen] = useState(false);
  const [isLayoutExpanded, setIsLayoutExpanded] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      <div className="ml-16 flex flex-col">
        <TopBar isExpanded={isLayoutExpanded} onToggleLayout={() => setIsLayoutExpanded(!isLayoutExpanded)} />
        
        <main className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Ship className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">Shipments</h1>
            </div>
            <button className="p-2 hover:bg-muted rounded-lg transition-colors">
              <MoreVertical className="w-5 h-5 text-foreground" />
            </button>
          </div>

          {/* Charts Grid */}
          {!isLayoutExpanded ? (
            // Default mode: 4 charts (2x2) and map split 50/50
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 transition-all duration-500 ease-in-out">
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                <DashboardCard title="Carbon Emissions">
                  <CarbonEmissionsChart />
                </DashboardCard>
                
                <DashboardCard title="Shipment Volumes">
                  <ShipmentVolumesChart />
                </DashboardCard>
                
                <DashboardCard title="Total Freight Weight">
                  <FreightWeightChart />
                </DashboardCard>

                <DashboardCard title="Shipment Model, Gross & Volume">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">By Model</p>
                      <ShipmentDistributionChart type="model" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">By Volume</p>
                      <ShipmentDistributionChart type="volume" />
                    </div>
                  </div>
                </DashboardCard>
              </div>
              
              <div>
                <DashboardCard title="Live Shipment Tracking">
                  <ShipmentMap />
                </DashboardCard>
              </div>
            </div>
          ) : (
            // Expanded mode: All 4 charts first, then map
            <div className="space-y-6 transition-all duration-500 ease-in-out">
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                <DashboardCard title="Carbon Emissions">
                  <CarbonEmissionsChart />
                </DashboardCard>
                
                <DashboardCard title="Shipment Volumes">
                  <ShipmentVolumesChart />
                </DashboardCard>
                
                <DashboardCard title="Total Freight Weight">
                  <FreightWeightChart />
                </DashboardCard>

                <DashboardCard title="Shipment Model, Gross & Volume">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">By Model</p>
                      <ShipmentDistributionChart type="model" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">By Volume</p>
                      <ShipmentDistributionChart type="volume" />
                    </div>
                  </div>
                </DashboardCard>
              </div>

              <DashboardCard title="Live Shipment Tracking">
                <ShipmentMap />
              </DashboardCard>
            </div>
          )}

          {/* Filter Buttons */}
          <div className="pt-4">
            <FilterButtons />
          </div>

          {/* Shipment Tables */}
          <div className="space-y-4">
            {/* In-Transit Shipments */}
            <Collapsible open={inTransitOpen} onOpenChange={setInTransitOpen}>
              <div className="bg-card rounded-lg border border-border">
                <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <Ship className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-semibold">In-Transit Shipments</h2>
                    <Badge variant="secondary" className="bg-info/10 text-info">
                      {inTransitShipments.length}
                    </Badge>
                  </div>
                  {inTransitOpen ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="p-4 pt-0">
                    <ShipmentTable data={inTransitShipments} gridId="in-transit-grid" />
                    <div className="mt-4 text-center text-sm text-muted-foreground">
                      Showing 1 to {inTransitShipments.length} of {inTransitShipments.length} shipments
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>

            {/* Pending Shipments */}
            <Collapsible open={pendingOpen} onOpenChange={setPendingOpen}>
              <div className="bg-card rounded-lg border border-border">
                <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <Ship className="w-5 h-5 text-warning" />
                    <h2 className="text-lg font-semibold">Pending Shipments</h2>
                    <Badge variant="secondary" className="bg-warning/10 text-warning">
                      {pendingShipments.length}
                    </Badge>
                  </div>
                  {pendingOpen ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="p-4 pt-0">
                    <ShipmentTable data={pendingShipments} gridId="pending-grid" height={420} />
                    <div className="mt-4 text-center text-sm text-muted-foreground">
                      Showing 1 to {pendingShipments.length} of {pendingShipments.length} shipments
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>

            {/* Completed Shipments */}
            <Collapsible open={completedOpen} onOpenChange={setCompletedOpen}>
              <div className="bg-card rounded-lg border border-border">
                <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <Ship className="w-5 h-5 text-success" />
                    <h2 className="text-lg font-semibold">Completed Shipments</h2>
                    <Badge variant="secondary" className="bg-success/10 text-success">
                      {completedShipments.length}
                    </Badge>
                  </div>
                  {completedOpen ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="p-4 pt-0">
                    <ShipmentTable data={completedShipments} gridId="completed-grid" height={480} />
                    <div className="mt-4 text-center text-sm text-muted-foreground">
                      Showing 1 to {completedShipments.length} of {completedShipments.length} shipments
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
