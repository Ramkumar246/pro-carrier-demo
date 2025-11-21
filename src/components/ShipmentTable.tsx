import { useRef, useMemo, useCallback, useState, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule ,themeQuartz} from 'ag-grid-community';
import { AllEnterpriseModule, IntegratedChartsModule, LicenseManager } from 'ag-grid-enterprise';
import { AgChartsEnterpriseModule } from 'ag-charts-enterprise';
import type { ColDef, GridReadyEvent, GridApi } from 'ag-grid-community';
// import 'ag-grid-community/styles/ag-grid.css';
// import 'ag-grid-community/styles/ag-theme-quartz.css';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  Cell,
  PieChart,
  Pie,
  Legend,
  ScatterChart,
  Scatter,
  ZAxis,
  LineChart,
  Line,
} from "recharts";
import { Download, Filter, RefreshCw, ChevronDown, FileSpreadsheet, FileText, CheckCircle2, SlidersHorizontal } from "lucide-react";
import type { Shipment } from "@/types/shipment";
import type { DelayStage } from "@/lib/delay-utils";
import { getStageDelay } from "@/lib/delay-utils";

const DELAY_STAGES: DelayStage[] = ["pickup", "departure", "arrival", "delivery"];
const STAGE_LABEL: Record<DelayStage, string> = {
  pickup: "Pickup Delay",
  departure: "Departure Delay",
  arrival: "Arrival Delay",
  delivery: "Delivery Delay",
};
const STAGE_COLOR: Record<DelayStage, string> = {
  pickup: "#2b2a7a", // deep indigo
  departure: "#2f82c9", // cobalt blue
  arrival: "#39c7c4", // teal
  delivery: "#f85a9d", // vibrant pink
};

type DelayChartDatum = {
  stage: DelayStage;
  label: string;
  delay: number;
  count: number;
};

type ContainerMixDatum = {
  label: string;
  value: number;
  mode: string;
  color: string;
  transportMode?: string; // For grouping by transport mode
};

type TransportModeDatum = {
  label: string;
  value: number;
  mode: string;
  color: string;
  containerModes: ContainerMixDatum[]; // Container modes within this transport mode
};

type TradePartyCostDatum = {
  tradeParty: string;
  cost: number;
  shipmentCount: number;
  x: number; // For bubble chart positioning
  y: number; // For bubble chart positioning
  z: number; // For bubble size
  color: string; // Brand color for each trade party
};

type ChartSelection = "delay" | "containerMix" | "tradePartyCost";

const chartOptions: { value: ChartSelection; label: string }[] = [
  { value: "delay", label: "Delay Overview" },
  { value: "containerMix", label: "Container Mix" },
  { value: "tradePartyCost", label: "Trade Party Cost" },
];

// Brand colors for container modes
const CONTAINER_MODE_COLORS: Record<string, string> = {
  FCL: "#2b2a7a", // deep indigo (from delay chart)
  LCL: "#2f82c9", // cobalt blue (from delay chart)
  ROR: "#39c7c4", // teal (from delay chart)
  LSE: "#f85a9d", // vibrant pink (from delay chart)
  LTL: "#4b39ef", // purple
  FTL: "#10b981", // green
};

// Transport mode colors for inner donut
const TRANSPORT_MODE_COLORS: Record<string, string> = {
  Sea: "#2b2a7a", // deep indigo
  Air: "#2f82c9", // cobalt blue
  Road: "#39c7c4", // teal
};

// Register AG Grid Community + Enterprise modules with Charts
ModuleRegistry.registerModules([
  AllCommunityModule,
  AllEnterpriseModule,
  IntegratedChartsModule.with(AgChartsEnterpriseModule)
]);

// Set up license key placeholder so enterprise watermark is displayed until replaced
LicenseManager.setLicenseKey(
  import.meta.env?.VITE_AG_GRID_LICENSE_KEY ??
  "This is a development-only AG Grid Enterprise evaluation. Replace with your license key."
);

interface ShipmentTableProps {
  data: Shipment[];
  gridId: string;
  height?: number;
  activeFilter?: "All" | "Sea" | "Air" | "Road";
}

const getStatusColor = (status: string | null | undefined) => {
  if (!status) return "bg-warning/10 text-warning hover:bg-warning/20";
  if (status.includes("Delivery")) return "bg-success/10 text-success hover:bg-success/20";
  if (status.includes("Arrival")) return "bg-info/10 text-info hover:bg-info/20";
  return "bg-warning/10 text-warning hover:bg-warning/20";
};

// Custom Status Cell Renderer
const StatusCellRenderer = (props: any) => {
  return (
    <Badge variant="secondary" className={getStatusColor(props.value)}>
      {props.value}
    </Badge>
  );
};

// Custom Delay Cell Renderer
const DelayCellRenderer = (props: any) => {
  const data = props.data || {};
  const stage: DelayStage | undefined = props.stage || props?.colDef?.cellRendererParams?.stage;
  const delay = stage ? getStageDelay(stage, data) : null;
  
  if (delay === null) {
    return <span className="text-muted-foreground">-</span>;
  }
  
  if (delay === 0) {
    return (
      <div className="flex items-center gap-1 text-green-600">
        <CheckCircle2 className="h-4 w-4" />
        <span>0</span>
      </div>
    );
  }
  
  return (
    <span className="text-red-600 font-semibold">{delay} days</span>
  );
};

const DelaySummaryChart = ({ data }: { data: DelayChartDatum[] }) => {
  if (!data.length) {
    return (
      <div className="mt-4 rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        No delay data available for the current grid selection or filters.
      </div>
    );
  }

  const maxDelay = Math.max(...data.map((entry) => entry.delay), 0);
  const upperBound = Math.max(5, Math.ceil(maxDelay));
  const ticks =
    upperBound > 0 ? Array.from({ length: upperBound }, (_, index) => index + 1) : [1, 2, 3, 4, 5];

  return (
    <div className="mt-4 rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="mb-4 flex flex-col gap-1">
        <h3 className="text-base font-semibold text-foreground">Average Delay by Milestone</h3>
        <p className="text-sm text-muted-foreground">
          Calculates the average number of late days across all visible shipments for each milestone.
        </p>
      </div>
      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, bottom: 8, left: 16, right: 16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              interval={0}
            />
            <YAxis
              type="number"
              ticks={ticks}
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              label={{
                value: "Delay (days)",
                angle: -90,
                position: "insideLeft",
                offset: 10,
                fill: "hsl(var(--muted-foreground))",
              }}
              domain={[0, Math.max(...ticks)]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "0.5rem",
              }}
              formatter={(value: number) => [`${value.toFixed(2)} days`, "Delay"]}
            />
            <Bar dataKey="delay" radius={[4, 4, 0, 0]} barSize={36}>
              {data.map((entry) => (
                <Cell key={entry.stage} fill={STAGE_COLOR[entry.stage]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const ContainerModePieChart = ({ data, activeFilter }: { data: ContainerMixDatum[]; activeFilter?: "All" | "Sea" | "Air" | "Road" }) => {
  if (!data.length) {
    return (
      <div className="mt-4 rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        No container mode data available for the current grid selection or filters.
      </div>
    );
  }

  // Use brand colors from delay chart
  const getColor = (mode: string) => {
    return CONTAINER_MODE_COLORS[mode] || "hsl(var(--muted-foreground))";
  };

  return (
    <div className="mt-4 rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="mb-4 flex flex-col gap-1">
        <h3 className="text-base font-semibold text-foreground">Container Mix</h3>
        <p className="text-sm text-muted-foreground">
          Shows the distribution of shipment container modes for the current selection.
        </p>
      </div>
      <div className="h-[340px] w-full pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "0.5rem",
              }}
              formatter={(value: number, name: string) => [`${value} shipments`, name]}
            />
            <Legend />
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              cx="50%"
              cy="50%"
              outerRadius={110}
            >
              {data.map((entry) => (
                <Cell key={entry.mode} fill={getColor(entry.mode)} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const ContainerModeMultipleDonutChart = ({ transportData }: { transportData: TransportModeDatum[] }) => {
  if (!transportData.length) {
    return (
      <div className="mt-4 rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        No container mode data available for the current grid selection or filters.
      </div>
    );
  }

  const getContainerColor = (mode: string) => {
    return CONTAINER_MODE_COLORS[mode] || "hsl(var(--muted-foreground))";
  };

  const getTransportColor = (mode: string) => {
    return TRANSPORT_MODE_COLORS[mode] || "hsl(var(--muted-foreground))";
  };

  // Calculate total for angle calculations
  const total = transportData.reduce((sum, entry) => sum + entry.value, 0);
  
  // Build hierarchical data structure with calculated angles
  // Start at top (12 o'clock = 90 degrees in Recharts coordinate system)
  const startAngle = 90;
  const paddingAngleDegrees = 2; // paddingAngle in degrees for inner ring
  const containerPaddingAngle = 1; // paddingAngle in degrees for outer ring
  
  // Calculate angles for inner ring (transport modes)
  let cumulativeAngle = startAngle;
  const transportAngles = transportData.map((entry, index) => {
    // Calculate the proportional angle for this transport mode
    const proportionalAngle = (entry.value / total) * 360;
    
    // For the first segment, start at startAngle
    // For subsequent segments, account for padding from previous segment
    const segmentStartAngle = index === 0 ? cumulativeAngle : cumulativeAngle + paddingAngleDegrees;
    
    // Calculate the actual angle span (accounting for padding)
    // The last segment doesn't need to account for padding at the end
    const actualAngle = index === transportData.length - 1 
      ? proportionalAngle - (index * paddingAngleDegrees)
      : proportionalAngle - paddingAngleDegrees;
    
    const segmentEndAngle = segmentStartAngle + actualAngle;
    
    // Update cumulative angle for next segment
    cumulativeAngle = segmentEndAngle;
    
    return {
      ...entry,
      startAngle: segmentStartAngle,
      endAngle: segmentEndAngle,
      angle: actualAngle, // Store the actual angle span for container mode calculations
    };
  });

  // Build flattened container mode data with calculated angles for nested positioning
  // Container modes must fit exactly within their parent transport mode's angular span
  const containerSegments: Array<ContainerMixDatum & { startAngle: number; endAngle: number; transportMode: string }> = [];
  
  transportAngles.forEach((transport) => {
    if (!transport.containerModes || transport.containerModes.length === 0) return;
    
    // Calculate total container mode count for this transport mode
    const containerTotal = transport.containerModes.reduce((sum, c) => sum + c.value, 0);
    
    // Container modes must fit within the transport mode's angle range
    // Start from the transport mode's startAngle
    let containerCumulativeAngle = transport.startAngle;
    const numContainers = transport.containerModes.length;
    
    transport.containerModes.forEach((container, containerIndex) => {
      // Calculate proportional angle within the transport mode's available angle
      // The available angle is the transport mode's angle minus padding for container segments
      const totalContainerPadding = (numContainers - 1) * containerPaddingAngle;
      const availableAngle = transport.angle - totalContainerPadding;
      
      const containerProportionalAngle = (container.value / containerTotal) * availableAngle;
      
      // Calculate start and end angles for this container segment
      const containerStartAngle = containerIndex === 0 
        ? containerCumulativeAngle 
        : containerCumulativeAngle + containerPaddingAngle;
      
      const containerEndAngle = containerStartAngle + containerProportionalAngle;
      
      // Update cumulative angle for next container segment
      containerCumulativeAngle = containerEndAngle;
      
      containerSegments.push({
        ...container,
        startAngle: containerStartAngle,
        endAngle: containerEndAngle,
        transportMode: transport.mode,
      });
    });
  });

  return (
    <div className="mt-4 rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="mb-4 flex flex-col gap-1">
        <h3 className="text-base font-semibold text-foreground">Container Mix</h3>
        <p className="text-sm text-muted-foreground">
          Inner ring shows transport modes (Sea, Air, Road). Outer ring shows container modes nested within their transport modes.
        </p>
      </div>
      <div className="h-[400px] w-full pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "0.5rem",
              }}
              formatter={(value: number, name: string) => [`${value} shipments`, name]}
            />
            {/* Inner ring - Transport modes */}
            <Pie
              data={transportData}
              dataKey="value"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              stroke="none"
              cornerRadius={4}
              label={(props: any) => {
                const { cx, cy, midAngle, innerRadius, outerRadius, name } = props;
                const RADIAN = Math.PI / 180;
                const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                const x = cx + radius * Math.cos(-midAngle * RADIAN);
                const y = cy + radius * Math.sin(-midAngle * RADIAN);
                
                return (
                  <text
                    x={x}
                    y={y}
                    fill="white"
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={12}
                    fontWeight={600}
                  >
                    {name}
                  </text>
                );
              }}
            >
              {transportData.map((entry) => (
                <Cell key={entry.mode} fill={getTransportColor(entry.mode)} stroke="none" />
              ))}
            </Pie>
            {/* Outer ring - Container modes nested within transport modes */}
            {containerSegments.map((segment, idx) => {
              // Calculate mid angle for this segment
              const segmentMidAngle = (segment.startAngle + segment.endAngle) / 2;
              
              return (
                <Pie
                  key={`${segment.transportMode}-${segment.mode}-${idx}`}
                  data={[segment]}
                  dataKey="value"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius={110}
                  outerRadius={140}
                  startAngle={segment.startAngle}
                  endAngle={segment.endAngle}
                  paddingAngle={1}
                  stroke="none"
                  cornerRadius={4}
                  label={(props: any) => {
                    const { cx, cy, innerRadius, outerRadius } = props;
                    const RADIAN = Math.PI / 180;
                    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                    const x = cx + radius * Math.cos(-segmentMidAngle * RADIAN);
                    const y = cy + radius * Math.sin(-segmentMidAngle * RADIAN);
                    
                    return (
                      <text
                        x={x}
                        y={y}
                        fill="white"
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize={11}
                        fontWeight={500}
                      >
                        {segment.label}
                      </text>
                    );
                  }}
                >
                  <Cell fill={getContainerColor(segment.mode)} stroke="none" />
                </Pie>
              );
            })}
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const TradePartyCostLineChart = ({ data }: { data: TradePartyCostDatum[] }) => {
  if (!data.length) {
    return (
      <div className="mt-4 rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        No trade party cost data available for the current grid selection or filters.
      </div>
    );
  }

  const maxCost = Math.max(...data.map((d) => d.cost), 0);
  const brandColors = [
    "hsl(var(--primary))",
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
    "#4b39ef",
    "#39bdf8",
    "#f97316",
    "#10b981",
  ];

  return (
    <div className="mt-4 rounded-lg border border-border bg-card p-4 shadow-sm trade-party-chart">
      <div className="mb-4 flex flex-col gap-1">
        <h3 className="text-base font-semibold text-foreground">Trade Party Cost Analysis</h3>
        <p className="text-sm text-muted-foreground">
          Shows total cost (USD) by trade party. Each point represents a trade party's total cost.
        </p>
      </div>
      <div className="h-[400px] w-full pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, bottom: 60, left: 50 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="tradeParty"
              name="Trade Party"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              angle={-45}
              textAnchor="end"
              height={60}
              interval={0}
              label={{
                value: "Trade Party",
                position: "insideBottom",
                offset: -5,
                fill: "hsl(var(--muted-foreground))",
                style: { fontSize: 12 },
              }}
            />
            <YAxis
              type="number"
              dataKey="cost"
              name="Total Cost (USD)"
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(value) => {
                return Number(value).toFixed(2);
              }}
              label={{
                value: "Total Cost (USD)",
                angle: -90,
                position: "insideLeft",
                offset: 0,
                fill: "hsl(var(--muted-foreground))",
                style: { fontSize: 12 },
              }}
              domain={[0, maxCost * 1.1]}
              width={50}
            />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "0.5rem",
                padding: "8px 12px",
              }}
              formatter={(value: number, name: string, props: any) => {
                if (name === "Total Cost (USD)") {
                  return [`$${Number(value || 0).toLocaleString()}`, "Total Cost"];
                }
                if (name === "Shipment Count" && props?.payload) {
                  return [`${props.payload.shipmentCount || 0} shipments`, "Count"];
                }
                return [value || 0, name];
              }}
              labelFormatter={(label) => {
                return label || "Trade Party";
              }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              verticalAlign="bottom"
            />
            <Line
              type="monotone"
              dataKey="cost"
              name="Total Cost (USD)"
              stroke={brandColors[0]}
              strokeWidth={3}
              dot={{ fill: brandColors[0], r: 6 }}
              activeDot={{ r: 8 }}
              label={(props: any) => {
                const { x, y, payload, value } = props;
                if (!payload || (payload.cost === undefined && value === undefined)) {
                  return null;
                }
                const costValue = payload?.cost ?? value ?? 0;
                return (
                  <text
                    x={x}
                    y={y - 10}
                    fill="hsl(var(--foreground))"
                    fontSize={10}
                    fontWeight={500}
                    textAnchor="middle"
                  >
                    ${Number(costValue).toLocaleString()}
                  </text>
                );
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};


const ShipmentTable = ({ data, gridId, height = 520, activeFilter }: ShipmentTableProps) => {
  const gridRef = useRef<AgGridReact<Shipment>>(null);
  const apiRef = useRef<GridApi<Shipment> | null>(null);
  const columnApiRef = useRef<any>(null);
  const popupParent = typeof document !== 'undefined' ? document.body : undefined;
  const [selectedCharts, setSelectedCharts] = useState<ChartSelection[]>(["delay", "containerMix"]);
  const [delayChartData, setDelayChartData] = useState<DelayChartDatum[] | null>(null);
  const [containerMixData, setContainerMixData] = useState<ContainerMixDatum[] | null>(null);
  const [transportModeData, setTransportModeData] = useState<TransportModeDatum[] | null>(null);
  const [tradePartyCostData, setTradePartyCostData] = useState<TradePartyCostDatum[] | null>(null);

  const toggleChartSelection = useCallback((value: ChartSelection, checked: boolean) => {
    setSelectedCharts((prev) => {
      if (checked) {
        if (prev.includes(value)) return prev;
        return [...prev, value];
      }
      return prev.filter((item) => item !== value);
    });
  }, []);

  const buildDelayChartData = useCallback((): DelayChartDatum[] => {
    const api = apiRef.current;
    if (!api) return [];

    const totals: Record<DelayStage, { sum: number; count: number }> = {
      pickup: { sum: 0, count: 0 },
      departure: { sum: 0, count: 0 },
      arrival: { sum: 0, count: 0 },
      delivery: { sum: 0, count: 0 },
    };

    api.forEachNodeAfterFilterAndSort((node) => {
      const row = node.data;
      if (!row) return;
      DELAY_STAGES.forEach((stage) => {
        const value = getStageDelay(stage, row);
        if (value !== null) {
          totals[stage].sum += value;
          totals[stage].count += 1;
        }
      });
    });

    return DELAY_STAGES.map((stage) => {
      const total = totals[stage];
      const average = total.count ? Number((total.sum / total.count).toFixed(2)) : 0;
      return {
        stage,
        label: STAGE_LABEL[stage],
        delay: average,
        count: total.count,
      };
    });
  }, []);

  const buildContainerMixData = useCallback((): ContainerMixDatum[] => {
    const api = apiRef.current;
    if (!api) return [];

    const counts: Record<string, number> = {};
    api.forEachNodeAfterFilterAndSort((node) => {
      const row = node.data;
      if (!row?.containerMode) return;
      counts[row.containerMode] = (counts[row.containerMode] || 0) + 1;
    });

    return Object.entries(counts).map(([mode, count]) => ({
      label: mode,
      value: count,
      mode,
      color: CONTAINER_MODE_COLORS[mode] ?? "#94a3b8",
    }));
  }, []);

  const buildTransportModeData = useCallback((): TransportModeDatum[] => {
    const api = apiRef.current;
    if (!api) return [];

    const transportData: Record<string, Record<string, number>> = {};
    
    api.forEachNodeAfterFilterAndSort((node) => {
      const row = node.data;
      if (!row?.transportMode || !row?.containerMode) return;
      
      if (!transportData[row.transportMode]) {
        transportData[row.transportMode] = {};
      }
      transportData[row.transportMode][row.containerMode] = 
        (transportData[row.transportMode][row.containerMode] || 0) + 1;
    });

    return Object.entries(transportData).map(([transportMode, containerCounts]) => {
      const totalCount = Object.values(containerCounts).reduce((sum, count) => sum + count, 0);
      const containerModes = Object.entries(containerCounts).map(([mode, count]) => ({
        label: mode,
        value: count,
        mode,
        color: CONTAINER_MODE_COLORS[mode] ?? "#94a3b8",
        transportMode,
      }));

      return {
        label: transportMode,
        value: totalCount,
        mode: transportMode,
        color: TRANSPORT_MODE_COLORS[transportMode] ?? "#94a3b8",
        containerModes,
      };
    });
  }, []);

  const buildTradePartyCostData = useCallback((): TradePartyCostDatum[] => {
    const api = apiRef.current;
    if (!api) return [];

    const tradePartyData: Record<string, { totalCost: number; count: number }> = {};
    
    api.forEachNodeAfterFilterAndSort((node) => {
      const row = node.data;
      if (!row?.tradeParty || row.costUsd == null) return;
      
      const party = row.tradeParty;
      if (!tradePartyData[party]) {
        tradePartyData[party] = { totalCost: 0, count: 0 };
      }
      tradePartyData[party].totalCost += Number(row.costUsd) || 0;
      tradePartyData[party].count += 1;
    });

    const brandColors = [
      "hsl(var(--primary))",
      "hsl(var(--chart-1))",
      "hsl(var(--chart-2))",
      "hsl(var(--chart-3))",
      "hsl(var(--chart-4))",
      "hsl(var(--chart-5))",
      "#4b39ef",
      "#39bdf8",
      "#f97316",
      "#10b981",
    ];

    return Object.entries(tradePartyData).map(([tradeParty, data], index) => ({
      tradeParty,
      cost: data.totalCost,
      shipmentCount: data.count,
      x: index + 1, // Position on X-axis
      y: data.totalCost, // Cost on Y-axis
      z: data.count * 10, // Bubble size based on shipment count
      color: brandColors[index % brandColors.length],
    }));
  }, []);

  // Column Definitions with all features
  const columnDefs: ColDef<Shipment>[] = useMemo(() => [
    {
      headerName: 'OUR REFERENCE',
      field: 'id',
      checkboxSelection: true,
      headerCheckboxSelection: true,
      pinned: 'left',
      minWidth: 150,
      flex: 0,
      width: 190,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      sortable: true,
      resizable: true,
      enableRowGroup: true,
      wrapText: true,
    },
    {
      headerName: 'STATUS',
      field: 'status',
      cellRenderer: StatusCellRenderer,
      minWidth: 150,
      flex: 0,
      width: 200,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      sortable: true,
      resizable: true,
      enableRowGroup: true,
      enablePivot: true,
      wrapText: true,
    },
    {
      headerName: 'ORIGIN',
      field: 'origin',
      minWidth: 100,
      flex: 0,
      width: 120,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      sortable: true,
      resizable: true,
      enableRowGroup: true,
      enablePivot: true,
      wrapText: true,
    },
    {
      headerName: 'ROUTE',
      field: 'route',
      minWidth: 180,
      flex: 1,
      width: 220,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      sortable: true,
      resizable: true,
      enableRowGroup: true,
      enablePivot: true,
      wrapText: true,
    },
    {
      headerName: 'MODE',
      field: 'transportMode',
      minWidth: 100,
      flex: 0,
      width: 140,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      sortable: true,
      resizable: true,
      enableRowGroup: true,
      enablePivot: true,
      wrapText: true,
    },
    {
      headerName: 'CONTAINER MODE',
      field: 'containerMode',
      minWidth: 130,
      flex: 0,
      width: 150,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      sortable: true,
      resizable: true,
      enableRowGroup: true,
      enablePivot: true,
      wrapText: true,
    },
    {
      headerName: 'DEPARTURE',
      children: [
        {
          headerName: 'ETD',
          field: 'departure',
          minWidth: 120,
          flex: 0,
          width: 140,
          filter: 'agTextColumnFilter',
          floatingFilter: true,
          sortable: true,
          resizable: true,
          enableRowGroup: true,
          enablePivot: true,
          wrapText: true,
        },
        {
          headerName: 'ATD',
          field: 'departureActualDate',
          minWidth: 120,
          flex: 0,
          width: 140,
          filter: 'agTextColumnFilter',
          floatingFilter: true,
          sortable: true,
          resizable: true,
          enableRowGroup: true,
          enablePivot: true,
          wrapText: true,
          valueGetter: (params) => params.data?.departureActualDate || '-',
        },
        {
          headerName: 'Delay',
          colId: 'departureDelay',
          minWidth: 100,
          flex: 0,
          width: 120,
          sortable: true,
          resizable: true,
          cellRenderer: DelayCellRenderer,
          cellRendererParams: { stage: 'departure' },
          valueGetter: (params) => {
            if (!params.data) return -1;
            const delay = getStageDelay('departure', params.data);
            return delay !== null ? delay : -1;
          },
          comparator: (valueA: number, valueB: number) => {
            if (valueA === -1) return 1;
            if (valueB === -1) return -1;
            return valueA - valueB;
          },
        },
      ],
    },
    {
      headerName: 'ARRIVAL',
      children: [
        {
          headerName: 'ETA',
          field: 'arrival',
          minWidth: 120,
          flex: 0,
          width: 140,
          filter: 'agTextColumnFilter',
          floatingFilter: true,
          sortable: true,
          resizable: true,
          enableRowGroup: true,
          enablePivot: true,
          wrapText: true,
        },
        {
          headerName: 'ATA',
          field: 'arrivalActualDate',
          minWidth: 120,
          flex: 0,
          width: 140,
          filter: 'agTextColumnFilter',
          floatingFilter: true,
          sortable: true,
          resizable: true,
          enableRowGroup: true,
          enablePivot: true,
          wrapText: true,
          valueGetter: (params) => params.data?.arrivalActualDate || '-',
        },
        {
          headerName: 'Delay',
          colId: 'arrivalDelay',
          minWidth: 100,
          flex: 0,
          width: 120,
          sortable: true,
          resizable: true,
          cellRenderer: DelayCellRenderer,
          cellRendererParams: { stage: 'arrival' },
          valueGetter: (params) => {
            if (!params.data) return -1;
            const delay = getStageDelay('arrival', params.data);
            return delay !== null ? delay : -1;
          },
          comparator: (valueA: number, valueB: number) => {
            if (valueA === -1) return 1;
            if (valueB === -1) return -1;
            return valueA - valueB;
          },
        },
      ],
    },
    {
      headerName: 'PICKUP',
      children: [
        {
          headerName: 'Actual Date',
          field: 'pickupActualDate',
          minWidth: 120,
          flex: 0,
          width: 140,
          filter: 'agTextColumnFilter',
          floatingFilter: true,
          sortable: true,
          resizable: true,
          enableRowGroup: true,
          enablePivot: true,
          wrapText: true,
          valueGetter: (params: any) => params.data?.pickupActualDate || '-',
        },
        {
          headerName: 'Delay',
          minWidth: 100,
          flex: 0,
          width: 120,
          sortable: true,
          resizable: true,
          cellRenderer: DelayCellRenderer,
          cellRendererParams: { stage: 'pickup' },
          valueGetter: (params: any) => {
            if (!params.data) return -1;
            const delay = getStageDelay('pickup', params.data);
            return delay !== null ? delay : -1;
          },
          comparator: (valueA: number, valueB: number) => {
            if (valueA === -1) return 1;
            if (valueB === -1) return -1;
            return valueA - valueB;
          },
        },
      ],
    },
    {
      headerName: 'DELIVERY',
      children: [
        {
          headerName: 'Actual Date',
          field: 'deliveryActualDate',
          minWidth: 120,
          flex: 0,
          width: 140,
          filter: 'agTextColumnFilter',
          floatingFilter: true,
          sortable: true,
          resizable: true,
          enableRowGroup: true,
          enablePivot: true,
          wrapText: true,
          valueGetter: (params: any) => params.data?.deliveryActualDate || '-',
        },
        {
          headerName: 'Delay',
          minWidth: 100,
          flex: 0,
          width: 120,
          sortable: true,
          resizable: true,
          cellRenderer: DelayCellRenderer,
          cellRendererParams: { stage: 'delivery' },
          valueGetter: (params: any) => {
            if (!params.data) return -1;
            const delay = getStageDelay('delivery', params.data);
            return delay !== null ? delay : -1;
          },
          comparator: (valueA: number, valueB: number) => {
            if (valueA === -1) return 1;
            if (valueB === -1) return -1;
            return valueA - valueB;
          },
        },
      ],
    },
    {
      headerName: 'TRADE PARTY',
      field: 'tradeParty',
      minWidth: 150,
      flex: 1,
      width: 200,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      sortable: true,
      resizable: true,
      enableRowGroup: true,
      enablePivot: true,
      enableValue: false,
      wrapText: true,
    },
    {
      headerName: 'GROSS WEIGHT (kg)',
      field: 'grossWeight',
      minWidth: 140,
      flex: 0,
      width: 180,
      filter: 'agNumberColumnFilter',
      floatingFilter: true,
      sortable: true,
      resizable: true,
      enableValue: true,
      wrapText: true,
    },
    {
      headerName: 'VOLUME (TEU)',
      field: 'volumeTeu',
      minWidth: 120,
      flex: 0,
      width: 160,
      filter: 'agNumberColumnFilter',
      floatingFilter: true,
      sortable: true,
      resizable: true,
      enableValue: true,
      wrapText: true,
    },
    {
      headerName: 'CONTAINERS',
      field: 'containers',
      minWidth: 110,
      flex: 0,
      width: 140,
      filter: 'agNumberColumnFilter',
      floatingFilter: true,
      sortable: true,
      resizable: true,
      enableValue: true,
      wrapText: true,
    },
    {
      headerName: 'EST. COST (USD)',
      field: 'costUsd',
      minWidth: 150,
      flex: 0,
      width: 170,
      filter: 'agNumberColumnFilter',
      floatingFilter: true,
      sortable: true,
      resizable: true,
      valueFormatter: ({ value }) => {
        if (value == null || value === undefined) return '';
        return `$${Number(value).toLocaleString()}`;
      },
      enableValue: true,
      wrapText: true,
    },
  ], []);

  // Default Column Definition
  const defaultColDef = useMemo<ColDef>(() => ({
    sortable: true,
    filter: true,
    resizable: true,
    editable: false,
    enableCellChangeFlash: true,
    floatingFilter: true,
    suppressMenu: false,
    enableRowGroup: true,
    enableValue: true,
    enablePivot: true,
    wrapText: true,
    autoHeight: false,
    cellStyle: { 
      display: 'flex',
      alignItems: 'center',
      whiteSpace: 'normal',
      wordBreak: 'break-word',
    },
  }), []);

  const autoGroupColumnDef = useMemo<ColDef>(() => ({
    headerName: 'Group',
    minWidth: 220,
    pinned: 'left',
  }), []);

  // Grid Ready Event
  const renderCharts = useCallback(() => {
    const api = apiRef.current;
    if (!api) return;

    setDelayChartData(selectedCharts.includes("delay") ? buildDelayChartData() : null);
    
    if (selectedCharts.includes("containerMix")) {
      if (activeFilter === "All") {
        setTransportModeData(buildTransportModeData());
        setContainerMixData(null);
      } else {
        setContainerMixData(buildContainerMixData());
        setTransportModeData(null);
      }
    } else {
      setContainerMixData(null);
      setTransportModeData(null);
    }
    
    setTradePartyCostData(
      selectedCharts.includes("tradePartyCost") ? buildTradePartyCostData() : null,
    );
  }, [selectedCharts, buildDelayChartData, buildContainerMixData, buildTransportModeData, buildTradePartyCostData, activeFilter]);

  const onGridReady = useCallback((params: GridReadyEvent) => {
    apiRef.current = params.api;
    columnApiRef.current = (params as any).columnApi;
    // Auto-size all columns to fit content
    params.api.sizeColumnsToFit();
    // Auto-size columns based on content after a short delay to ensure data is rendered
    setTimeout(() => {
      const allColumnIds = params.api.getColumns()?.map(col => col.getColId()).filter(Boolean) || [];
      if (allColumnIds.length > 0) {
        params.api.autoSizeColumns(allColumnIds, false);
      }
    }, 100);
    setTimeout(() => renderCharts(), 0);
  }, [renderCharts]);

  // Export to CSV
  const onExportCSV = useCallback(() => {
    apiRef.current?.exportDataAsCsv({
      fileName: 'shipments-export.csv',
    });
  }, []);

  // Export to Excel (Enterprise)
  const onExportExcel = useCallback(() => {
    apiRef.current?.exportDataAsExcel({
      fileName: 'shipments-export.xlsx',
    });
  }, []);

  // Clear Filters
  const onClearFilters = useCallback(() => {
    apiRef.current?.setFilterModel(null);
    columnApiRef.current?.resetColumnState();
  }, []);

  const onResetColumns = useCallback(() => {
    if (apiRef.current) {
      // Reset column state (order, width, visibility, pinned, etc.)
      apiRef.current.resetColumnState();
      // Clear all filters
      apiRef.current.setFilterModel(null);
      // Clear sorting
      apiRef.current.applyColumnState({
        defaultState: { sort: null },
        applyOrder: false,
      });
      // Clear row grouping
      apiRef.current.setRowGroupColumns([]);
      // Clear pivot
      apiRef.current.setPivotColumns([]);
      // Refresh the grid
      apiRef.current.refreshClientSideRowModel();
      // Auto-size columns to fit content
      setTimeout(() => {
        const allColumnIds = apiRef.current?.getColumns()?.map(col => col.getColId()).filter(Boolean) || [];
        if (allColumnIds.length > 0 && apiRef.current) {
          apiRef.current.autoSizeColumns(allColumnIds, false);
        }
      }, 100);
    }
  }, []);

  useEffect(() => {
    renderCharts();
  }, [data, renderCharts]);

  return (
    <div className="w-full">
      {/* Toolbar */}
      <div className="flex gap-2 mb-3 flex-wrap items-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Export
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={onExportCSV} className="gap-2">
              <FileText className="h-4 w-4" />
              Export CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onExportExcel} className="gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Export Excel
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button 
          onClick={onClearFilters} 
          variant="outline" 
          size="sm"
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          Clear Filters
        </Button>
        <Button 
          onClick={onResetColumns} 
          variant="outline" 
          size="sm"
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Reset View
        </Button>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Chart Options
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem className="text-xs text-muted-foreground">
                Select one or more charts to render
              </DropdownMenuItem>
              <div className="my-1 h-px bg-border" />
              {chartOptions.map((option) => (
                <DropdownMenuCheckboxItem
                  key={option.value}
                  checked={selectedCharts.includes(option.value)}
                  onCheckedChange={(checked) => toggleChartSelection(option.value, !!checked)}
                >
                  {option.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* AG Grid Table */}
      <div
        id={gridId}
        className="ag-theme-quartz rounded-lg border border-border overflow-hidden"
        style={{ height, width: '100%' }}
      >
        <AgGridReact<Shipment>
          ref={gridRef}
          rowData={data}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          onGridReady={onGridReady}
          theme={themeQuartz}
          rowSelection="multiple"
          animateRows={true}
          pagination
          paginationPageSize={10}
          paginationPageSizeSelector={[10, 25, 50, 100]}
          // suppressRowClickSelection={true}
          domLayout="normal"
          suppressContextMenu={false}
          allowContextMenuWithControlKey={true}
          getContextMenuItems={() => [
            'copy',
            'copyWithHeaders',
            'separator',
            'export',
          ]}
          enableCharts
          enableRangeSelection={true}
          suppressRowClickSelection={false}
          sideBar={{
            toolPanels: [
              {
                id: 'columns',
                labelKey: 'columns',
                labelDefault: 'Columns',
                iconKey: 'columns',
                toolPanel: 'agColumnsToolPanel',
              },
              {
                id: 'filters',
                labelKey: 'filters',
                labelDefault: 'Filters',
                iconKey: 'filter',
                toolPanel: 'agFiltersToolPanel',
              },
              {
                id: 'charts',
                labelKey: 'charts',
                labelDefault: 'Charts',
                iconKey: 'menu',
                toolPanel: 'agChartsToolPanel',
              },
            ],
            defaultToolPanel: 'columns',
            hiddenByDefault: false,
          }}
          statusBar={{
            statusPanels: [
              { statusPanel: 'agTotalRowCountComponent', align: 'left' },
              { statusPanel: 'agFilteredRowCountComponent' },
              { statusPanel: 'agTotalAndFilteredRowCountComponent' },
              { statusPanel: 'agAggregationComponent' },
            ],
          }}
          autoGroupColumnDef={autoGroupColumnDef}
          rowGroupPanelShow="always"
          pivotPanelShow="always"
          suppressAggFuncInHeader={false}
          groupDisplayType="multipleColumns"
          chartThemes={['ag-default', 'ag-material', 'ag-sheets', 'ag-vivid']}
          cacheQuickFilter
          groupMaintainOrder
          popupParent={popupParent}
        />
      </div>
      {(delayChartData || containerMixData || transportModeData || tradePartyCostData) && selectedCharts.length > 0 && (
        <div
          className={`mt-4 grid gap-4 ${
            [delayChartData, containerMixData || transportModeData, tradePartyCostData].filter(Boolean).length === 1
              ? ""
              : [delayChartData, containerMixData || transportModeData, tradePartyCostData].filter(Boolean).length === 2
              ? "lg:grid-cols-2"
              : "lg:grid-cols-3"
          }`}
        >
          {selectedCharts.includes("delay") && delayChartData && (
            <DelaySummaryChart data={delayChartData} />
          )}
          {selectedCharts.includes("containerMix") && (
            <>
              {activeFilter === "All" && transportModeData ? (
                <ContainerModeMultipleDonutChart transportData={transportModeData} />
              ) : containerMixData ? (
                <ContainerModePieChart data={containerMixData} activeFilter={activeFilter} />
              ) : null}
            </>
          )}
          {selectedCharts.includes("tradePartyCost") && tradePartyCostData && (
            <TradePartyCostLineChart data={tradePartyCostData} />
          )}
        </div>
      )}
    </div>
  );
};

export default ShipmentTable;
