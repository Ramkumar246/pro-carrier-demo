import { useMemo, useState } from "react";
import { Ship, ChevronDown, ChevronUp, Search } from "lucide-react";
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

interface IndexProps {
  isLayoutExpanded?: boolean;
}

const Index = ({ isLayoutExpanded = false }: IndexProps) => {
  const [inTransitOpen, setInTransitOpen] = useState(true);
  const [pendingOpen, setPendingOpen] = useState(false);
  const [completedOpen, setCompletedOpen] = useState(false);
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
    <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Ship className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">Shipments</h1>
            </div>
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
                
                <DashboardCard title="Total Freight Spend">
                  <FreightWeightChart />
                </DashboardCard>

                <DashboardCard title="Shipment Mode by Volume">
                  <ShipmentDistributionChart />
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
                
                <DashboardCard title="Total Freight Spend">
                  <FreightWeightChart />
                </DashboardCard>

                <DashboardCard title="Shipment Mode by Volume">
                  <ShipmentDistributionChart />
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
          <div className="space-y-4 pt-2">
            {/* In-Transit Shipments */}
            <Collapsible open={inTransitOpen} onOpenChange={setInTransitOpen}>
              <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                <CollapsibleTrigger className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Ship className="w-4 h-4" />
                    </div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-semibold tracking-wide text-foreground">
                        In-Transit Shipments
                      </h2>
                      <Badge
                        variant="secondary"
                        className="rounded-full bg-primary/10 text-primary text-xs font-medium px-2 py-0.5"
                      >
                        {inTransitShipments.length}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className="hidden sm:inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted text-muted-foreground"
                    >
                      <Search className="h-4 w-4" />
                    </button>
                    {inTransitOpen ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-6 pb-6 pt-0">
                    <ShipmentTable data={inTransitShipments} gridId="in-transit-grid" activeFilter={activeFilter} />
                    <div className="mt-3 text-right text-xs text-muted-foreground">
                      Showing 1 to {inTransitShipments.length} of {inTransitShipments.length} shipments
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>

            {/* Pending Shipments */}
            <Collapsible open={pendingOpen} onOpenChange={setPendingOpen}>
              <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                <CollapsibleTrigger className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-warning/10 text-warning">
                      <Ship className="w-4 h-4" />
                    </div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-semibold tracking-wide text-foreground">
                        Pending Shipments
                      </h2>
                      <Badge
                        variant="secondary"
                        className="rounded-full bg-warning/10 text-warning text-xs font-medium px-2 py-0.5"
                      >
                        {pendingShipments.length}
                      </Badge>
                    </div>
                  </div>
                  {pendingOpen ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-6 pb-6 pt-0">
                    <ShipmentTable data={pendingShipments} gridId="pending-grid" height={420} activeFilter={activeFilter} />
                    <div className="mt-3 text-right text-xs text-muted-foreground">
                      Showing 1 to {pendingShipments.length} of {pendingShipments.length} shipments
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>

            {/* Completed Shipments */}
            <Collapsible open={completedOpen} onOpenChange={setCompletedOpen}>
              <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                <CollapsibleTrigger className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success/10 text-success">
                      <Ship className="w-4 h-4" />
                    </div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-semibold tracking-wide text-foreground">
                        Completed Shipments
                      </h2>
                      <Badge
                        variant="secondary"
                        className="rounded-full bg-success/10 text-success text-xs font-medium px-2 py-0.5"
                      >
                        {completedShipments.length}
                      </Badge>
                    </div>
                  </div>
                  {completedOpen ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-6 pb-6 pt-0">
                    <ShipmentTable data={completedShipments} gridId="completed-grid" height={480} activeFilter={activeFilter} />
                    <div className="mt-3 text-right text-xs text-muted-foreground">
                      Showing 1 to {completedShipments.length} of {completedShipments.length} shipments
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          </div>
    </div>
  );
};

export default Index;
