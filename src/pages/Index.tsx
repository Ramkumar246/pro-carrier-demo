import { useMemo, useState } from "react";
import { Ship, ChevronDown, ChevronUp, MoreVertical } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import DashboardCard from "@/components/DashboardCard";
import CarbonEmissionsChart from "@/components/charts/CarbonEmissionsChart";
import ShipmentVolumesChart from "@/components/charts/ShipmentVolumesChart";
import FreightWeightChart from "@/components/charts/FreightWeightChart";
import ShipmentDistributionChart from "@/components/charts/ShipmentDistributionChart";
import ShipmentMap from "@/components/ShipmentMap";
import ShipmentTable from "@/components/ShipmentTable";
import FilterButtons from "@/components/FilterButtons";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { filterShipmentsByMode, shipmentData, type TransportFilter } from "@/data/shipments";

const Index = () => {
  const [inTransitOpen, setInTransitOpen] = useState(true);
  const [pendingOpen, setPendingOpen] = useState(false);
  const [completedOpen, setCompletedOpen] = useState(false);
  const [isLayoutExpanded, setIsLayoutExpanded] = useState(false);
  const [activeFilter, setActiveFilter] = useState<TransportFilter>("Sea");

  const inTransitShipments = useMemo(
    () => filterShipmentsByMode(shipmentData.inTransit, activeFilter),
    [activeFilter],
  );
  const pendingShipments = useMemo(
    () => filterShipmentsByMode(shipmentData.pending, activeFilter),
    [activeFilter],
  );
  const completedShipments = useMemo(
    () => filterShipmentsByMode(shipmentData.completed, activeFilter),
    [activeFilter],
  );

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
            <FilterButtons activeFilter={activeFilter} onFilterChange={setActiveFilter} />
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
