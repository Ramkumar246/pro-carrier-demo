import { useRef, useMemo, useCallback, useState, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule, themeQuartz } from 'ag-grid-community';
import { AllEnterpriseModule, LicenseManager } from 'ag-grid-enterprise';
import type { ColDef, GridReadyEvent, GridApi, RowClickedEvent } from 'ag-grid-community';
import { useNavigate } from 'react-router-dom';
// import 'ag-grid-community/styles/ag-grid.css';
// import 'ag-grid-community/styles/ag-theme-quartz.css';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import * as am5percent from "@amcharts/amcharts5/percent";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import { Download, Filter, RefreshCw, ChevronDown, FileSpreadsheet, FileText, CheckCircle2, SlidersHorizontal, Search } from "lucide-react";
import type { Shipment } from "@/types/shipment";
import type { DelayStage } from "@/lib/delay-utils";
import { getStageDelay } from "@/lib/delay-utils";
import { getCSSVariableColor } from "@/lib/chart-colors";
import { Input } from "@/components/ui/input";

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
  // { value: "tradePartyCost", label: "Trade Party Cost" },
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

// Register AG Grid Community + Enterprise modules
ModuleRegistry.registerModules([
  AllCommunityModule,
  AllEnterpriseModule,
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
  const chartRef = useRef<am5xy.XYChart | null>(null);
  const rootRef = useRef<am5.Root | null>(null);
  const chartIdRef = useRef(`delayChart-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    if (!data.length) return;

    const root = am5.Root.new(chartIdRef.current);
    root._logo?.dispose();
    rootRef.current = root;

    root.setThemes([am5themes_Animated.new(root)]);

    // Get colors from CSS variables
    const cardColor = getCSSVariableColor("--card");
    const borderColor = getCSSVariableColor("--border");
    const foregroundColor = getCSSVariableColor("--foreground");

    const chart = root.container.children.push(
      am5xy.XYChart.new(root, {
        panX: false,
        panY: false,
        wheelX: "panX",
        wheelY: "zoomX",
        layout: root.verticalLayout,
      })
    );
    chartRef.current = chart;

    const xAxis = chart.xAxes.push(
      am5xy.CategoryAxis.new(root, {
        categoryField: "label",
        renderer: am5xy.AxisRendererX.new(root, {
          cellStartLocation: 0.1,
          cellEndLocation: 0.9,
        }),
      })
    );

    const yAxis = chart.yAxes.push(
      am5xy.ValueAxis.new(root, {
        renderer: am5xy.AxisRendererY.new(root, {}),
        min: 0,
      })
    );

    const series = chart.series.push(
      am5xy.ColumnSeries.new(root, {
        name: "Delay",
        xAxis: xAxis,
        yAxis: yAxis,
        valueYField: "delay",
        categoryXField: "label",
      })
    );

    series.columns.template.setAll({
      cornerRadiusTL: 4,
      cornerRadiusTR: 4,
      strokeOpacity: 0,
      tooltipText: "{categoryX}: {valueY} days",
    });

    series.columns.template.adapters.add("fill", (fill, target) => {
      const dataItem = target.dataItem;
      if (dataItem) {
        const stage = (dataItem.dataContext as DelayChartDatum).stage;
        return am5.color(STAGE_COLOR[stage]);
      }
      return fill;
    });

    series.data.setAll(data);
    xAxis.data.setAll(data);

    const cursor = chart.set("cursor", am5xy.XYCursor.new(root, {}));
    cursor.lineX.setAll({ strokeOpacity: 0.1 });
    cursor.lineY.setAll({ strokeOpacity: 0.1 });

    const tooltip = am5.Tooltip.new(root, {
      getFillFromSprite: false,
    });
    tooltip.get("background")?.setAll({
      fill: am5.color(cardColor),
      fillOpacity: 1,
      stroke: am5.color(borderColor),
      strokeWidth: 1,
    });
    tooltip.label.setAll({
      fill: am5.color(foregroundColor),
    });
    series.set("tooltip", tooltip);

    series.appear(1000);
    chart.appear(1000, 100);

    return () => {
      root.dispose();
    };
  }, [data]);

  if (!data.length) {
    return (
      <div className="mt-4 rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        No delay data available for the current grid selection or filters.
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="mb-4 flex flex-col gap-1">
        <h3 className="text-base font-semibold text-foreground">Average Delay by Milestone</h3>
        <p className="text-sm text-muted-foreground">
          Calculates the average number of late days across all visible shipments for each milestone.
        </p>
      </div>
      <div className="h-[320px] w-full">
        <div id={chartIdRef.current} style={{ width: "100%", height: "100%" }} />
      </div>
    </div>
  );
};

const ContainerModePieChart = ({ data, activeFilter }: { data: ContainerMixDatum[]; activeFilter?: "All" | "Sea" | "Air" | "Road" }) => {
  const chartRef = useRef<am5percent.PieChart | null>(null);
  const rootRef = useRef<am5.Root | null>(null);
  const chartIdRef = useRef(`containerPieChart-${Math.random().toString(36).substr(2, 9)}`);

  const getColor = (mode: string) => {
    return CONTAINER_MODE_COLORS[mode] || getCSSVariableColor("--muted-foreground");
  };

  useEffect(() => {
    if (!data.length) return;

    const root = am5.Root.new(chartIdRef.current);
    root._logo?.dispose();
    rootRef.current = root;

    root.setThemes([am5themes_Animated.new(root)]);

    // Get colors from CSS variables
    const cardColor = getCSSVariableColor("--card");
    const borderColor = getCSSVariableColor("--border");
    const foregroundColor = getCSSVariableColor("--foreground");

    const chart = root.container.children.push(
      am5percent.PieChart.new(root, {
        layout: root.verticalLayout,
      })
    );
    chartRef.current = chart;

    const series = chart.series.push(
      am5percent.PieSeries.new(root, {
        valueField: "value",
        categoryField: "label",
      })
    );

    series.slices.template.setAll({
      strokeWidth: 0,
      tooltipText: "{category}: {value} shipments",
    });

    series.data.setAll(
      data.map((entry) => ({
        label: entry.label,
        value: entry.value,
        fill: am5.color(getColor(entry.mode)),
      }))
    );

    series.labels.template.setAll({
      textType: "circular",
      centerX: 0,
      centerY: 0,
    });

    const tooltip = am5.Tooltip.new(root, {
      getFillFromSprite: false,
    });
    tooltip.get("background")?.setAll({
      fill: am5.color(cardColor),
      fillOpacity: 1,
      stroke: am5.color(borderColor),
      strokeWidth: 1,
    });
    tooltip.label.setAll({
      fill: am5.color(foregroundColor),
    });
    series.set("tooltip", tooltip);

    const legend = chart.children.push(
      am5.Legend.new(root, {
        centerX: am5.p50,
        x: am5.p50,
        marginTop: 15,
        marginBottom: 15,
      })
    );
    legend.data.setAll(series.dataItems);

    series.appear(1000, 100);
    chart.appear(1000, 100);

    return () => {
      root.dispose();
    };
  }, [data]);

  if (!data.length) {
    return (
      <div className="mt-4 rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        No container mode data available for the current grid selection or filters.
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="mb-4 flex flex-col gap-1">
        <h3 className="text-base font-semibold text-foreground">Container Mix</h3>
        <p className="text-sm text-muted-foreground">
          Shows the distribution of shipment container modes for the current selection.
        </p>
      </div>
      <div className="h-[340px] w-full pt-4">
        <div id={chartIdRef.current} style={{ width: "100%", height: "100%" }} />
      </div>
    </div>
  );
};

const ContainerModeMultipleDonutChart = ({ transportData }: { transportData: TransportModeDatum[] }) => {
  const chartRef = useRef<am5percent.PieChart | null>(null);
  const rootRef = useRef<am5.Root | null>(null);
  const chartIdRef = useRef(`containerDonutChart-${Math.random().toString(36).substr(2, 9)}`);

  const getContainerColor = (mode: string) => {
    return CONTAINER_MODE_COLORS[mode] || getCSSVariableColor("--muted-foreground");
  };

  const getTransportColor = (mode: string) => {
    return TRANSPORT_MODE_COLORS[mode] || getCSSVariableColor("--muted-foreground");
  };

  useEffect(() => {
    if (!transportData.length) return;

    const root = am5.Root.new(chartIdRef.current);
    root._logo?.dispose();
    rootRef.current = root;

    root.setThemes([am5themes_Animated.new(root)]);

    // Get colors from CSS variables
    const cardColor = getCSSVariableColor("--card");
    const borderColor = getCSSVariableColor("--border");
    const foregroundColor = getCSSVariableColor("--foreground");

    const chart = root.container.children.push(
      am5percent.PieChart.new(root, {
        layout: root.verticalLayout,
      })
    );
    chartRef.current = chart;

    // Inner ring - Transport modes
    const transportSeries = chart.series.push(
      am5percent.PieSeries.new(root, {
        valueField: "value",
        categoryField: "label",
        innerRadius: am5.percent(40),
        radius: am5.percent(65),
      })
    );

    transportSeries.slices.template.setAll({
      strokeWidth: 0,
      tooltipText: "{category}: {value} shipments",
    });

    transportSeries.data.setAll(
      transportData.map((entry) => ({
        label: entry.label,
        value: entry.value,
        fill: am5.color(getTransportColor(entry.mode)),
      }))
    );

    transportSeries.labels.template.setAll({
      textType: "circular",
      centerX: 0,
      centerY: 0,
      fill: am5.color("#ffffff"),
      fontSize: 12,
      fontWeight: "600",
    });

    // Outer ring - Container modes
    const containerSeries = chart.series.push(
      am5percent.PieSeries.new(root, {
        valueField: "value",
        categoryField: "label",
        innerRadius: am5.percent(70),
        radius: am5.percent(90),
      })
    );

    const allContainerData: Array<ContainerMixDatum & { transportMode: string }> = [];
    transportData.forEach((transport) => {
      if (transport.containerModes) {
        transport.containerModes.forEach((container) => {
          allContainerData.push({
            ...container,
            transportMode: transport.mode,
          });
        });
      }
    });

    containerSeries.slices.template.setAll({
      strokeWidth: 0,
      tooltipText: "{category}: {value} shipments",
    });

    containerSeries.data.setAll(
      allContainerData.map((entry) => ({
        label: entry.label,
        value: entry.value,
        fill: am5.color(getContainerColor(entry.mode)),
      }))
    );

    containerSeries.labels.template.setAll({
      textType: "circular",
      centerX: 0,
      centerY: 0,
      fill: am5.color("#ffffff"),
      fontSize: 11,
      fontWeight: "500",
    });

    const tooltip = am5.Tooltip.new(root, {
      getFillFromSprite: false,
    });
    tooltip.get("background")?.setAll({
      fill: am5.color(cardColor),
      fillOpacity: 1,
      stroke: am5.color(borderColor),
      strokeWidth: 1,
    });
    tooltip.label.setAll({
      fill: am5.color(foregroundColor),
    });
    transportSeries.set("tooltip", tooltip);
    containerSeries.set("tooltip", tooltip);

    transportSeries.appear(1000, 100);
    containerSeries.appear(1000, 100);
    chart.appear(1000, 100);

    return () => {
      root.dispose();
    };
  }, [transportData]);

  if (!transportData.length) {
    return (
      <div className="mt-4 rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        No container mode data available for the current grid selection or filters.
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="mb-4 flex flex-col gap-1">
        <h3 className="text-base font-semibold text-foreground">Container Mix</h3>
        <p className="text-sm text-muted-foreground">
          Inner ring shows transport modes (Sea, Air, Road). Outer ring shows container modes nested within their transport modes.
        </p>
      </div>
      <div className="h-[400px] w-full pt-4">
        <div id={chartIdRef.current} style={{ width: "100%", height: "100%" }} />
      </div>
    </div>
  );
};

const TradePartyCostLineChart = ({ data }: { data: TradePartyCostDatum[] }) => {
  const chartRef = useRef<am5xy.XYChart | null>(null);
  const rootRef = useRef<am5.Root | null>(null);
  const chartIdRef = useRef(`tradePartyChart-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    if (!data.length) return;

    const root = am5.Root.new(chartIdRef.current);
    root._logo?.dispose();
    rootRef.current = root;

    root.setThemes([am5themes_Animated.new(root)]);

    // Get colors from CSS variables
    const primaryColor = getCSSVariableColor("--primary");
    const cardColor = getCSSVariableColor("--card");
    const borderColor = getCSSVariableColor("--border");
    const foregroundColor = getCSSVariableColor("--foreground");

    const chart = root.container.children.push(
      am5xy.XYChart.new(root, {
        panX: false,
        panY: false,
        wheelX: "panX",
        wheelY: "zoomX",
        layout: root.verticalLayout,
      })
    );
    chartRef.current = chart;

    const xAxis = chart.xAxes.push(
      am5xy.CategoryAxis.new(root, {
        categoryField: "tradeParty",
        renderer: am5xy.AxisRendererX.new(root, {
          cellStartLocation: 0.1,
          cellEndLocation: 0.9,
          minGridDistance: 30,
        }),
      })
    );

    xAxis.get("renderer").labels.template.setAll({
      rotation: -45,
      centerY: am5.p100,
      centerX: am5.p0,
      paddingRight: 15,
    });

    const yAxis = chart.yAxes.push(
      am5xy.ValueAxis.new(root, {
        renderer: am5xy.AxisRendererY.new(root, {}),
        min: 0,
      })
    );

    const series = chart.series.push(
      am5xy.LineSeries.new(root, {
        name: "Total Cost (USD)",
        xAxis: xAxis,
        yAxis: yAxis,
        valueYField: "cost",
        categoryXField: "tradeParty",
        stroke: am5.color(primaryColor),
        fill: am5.color(primaryColor),
      })
    );

    series.strokes.template.setAll({
      strokeWidth: 3,
    });

    series.bullets.push(() => {
      return am5.Bullet.new(root, {
        sprite: am5.Circle.new(root, {
          radius: 6,
          fill: am5.color(primaryColor),
        }),
      });
    });

    series.data.setAll(data);
    xAxis.data.setAll(data);

    const cursor = chart.set("cursor", am5xy.XYCursor.new(root, {}));
    cursor.lineX.setAll({ strokeOpacity: 0.1 });
    cursor.lineY.setAll({ strokeOpacity: 0.1 });

    const tooltip = am5.Tooltip.new(root, {
      getFillFromSprite: false,
    });
    tooltip.get("background")?.setAll({
      fill: am5.color(cardColor),
      fillOpacity: 1,
      stroke: am5.color(borderColor),
      strokeWidth: 1,
    });
    tooltip.label.setAll({
      fill: am5.color(foregroundColor),
    });
    tooltip.label.adapters.add("text", (text, target) => {
      const dataItem = target.dataItem;
      if (dataItem) {
        const dataContext = dataItem.dataContext as TradePartyCostDatum;
        return `Trade Party: ${dataContext.tradeParty}\nTotal Cost: $${Number(dataContext.cost).toLocaleString()}\nShipments: ${dataContext.shipmentCount}`;
      }
      return text;
    });
    series.set("tooltip", tooltip);

    series.appear(1000);
    chart.appear(1000, 100);

    return () => {
      root.dispose();
    };
  }, [data]);

  if (!data.length) {
    return (
      <div className="mt-4 rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        No trade party cost data available for the current grid selection or filters.
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-lg border border-border bg-card p-4 shadow-sm trade-party-chart">
      <div className="mb-4 flex flex-col gap-1">
        <h3 className="text-base font-semibold text-foreground">Trade Party Cost Analysis</h3>
        <p className="text-sm text-muted-foreground">
          Shows total cost (USD) by trade party. Each point represents a trade party's total cost.
        </p>
      </div>
      <div className="h-[400px] w-full pt-4">
        <div id={chartIdRef.current} style={{ width: "100%", height: "100%" }} />
      </div>
    </div>
  );
};


const ShipmentTable = ({ data, gridId, height = 860, activeFilter }: ShipmentTableProps) => {
  const gridRef = useRef<AgGridReact<Shipment>>(null);
  const apiRef = useRef<GridApi<Shipment> | null>(null);
  const columnApiRef = useRef<any>(null);
  const popupParent = typeof document !== 'undefined' ? document.body : undefined;
  const navigate = useNavigate();
  const [selectedCharts, setSelectedCharts] = useState<ChartSelection[]>([]);
  const [isQuickFilterVisible, setIsQuickFilterVisible] = useState(false);
  const [quickFilterText, setQuickFilterText] = useState("");

  const applyQuickFilter = useCallback((value: string) => {
    if (apiRef.current && typeof (apiRef.current as any).setQuickFilter === "function") {
      (apiRef.current as any).setQuickFilter(value);
    }
  }, []);
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

  const toggleQuickFilterVisibility = useCallback(() => {
    setIsQuickFilterVisible((prev) => {
      if (prev) {
        setQuickFilterText("");
        applyQuickFilter("");
      }
      return !prev;
    });
  }, [applyQuickFilter]);

  const handleQuickFilterChange = useCallback((value: string) => {
    setQuickFilterText(value);
    applyQuickFilter(value);
  }, [applyQuickFilter]);

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
      getCSSVariableColor("--primary"),
      getCSSVariableColor("--chart-1"),
      getCSSVariableColor("--chart-2"),
      getCSSVariableColor("--chart-3"),
      getCSSVariableColor("--chart-4"),
      getCSSVariableColor("--chart-5"),
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
          headerName: 'Date',
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
          headerName: 'Date',
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
      cellStyle: { justifyContent: 'flex-end' },
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
      cellStyle: { justifyContent: 'flex-end' },
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
      cellStyle: { justifyContent: 'flex-end' },
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
      cellStyle: { justifyContent: 'flex-end' },
    },
    {
      headerName: 'TOTAL CO₂e (kg)',
      field: 'emissionCo2eKg',
      minWidth: 150,
      flex: 0,
      width: 170,
      filter: 'agNumberColumnFilter',
      floatingFilter: true,
      sortable: true,
      resizable: true,
      valueFormatter: ({ value }) => {
        if (value == null || value === undefined) return '-';
        return `${Number(value).toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })} kg`;
      },
      enableValue: true,
      wrapText: true,
      cellStyle: (params) => {
        if (params.value == null || params.value === undefined) {
          return { color: 'hsl(var(--muted-foreground))', fontStyle: 'italic', justifyContent: 'flex-end' };
        }
        return { justifyContent: 'flex-end' };
      },
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
    params.api.closeToolPanel();
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

  const onRowClicked = useCallback(
    (event: RowClickedEvent<Shipment>) => {
      const shipment = event.data;
      if (!shipment) return;
      if (
        shipment.transportMode === "Sea" ||
        shipment.transportMode === "Air" ||
        shipment.transportMode === "Road"
      ) {
        navigate("/external-page", {
          state: {
            transportMode: shipment.transportMode,
            shipment,
          },
        });
      }
    },
    [navigate],
  );

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
                Select one or more charts to display
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
          <Button
            type="button"
            onClick={toggleQuickFilterVisibility}
            variant={isQuickFilterVisible ? "secondary" : "outline"}
            size="icon"
            className="h-9 w-9"
          >
            <Search className="h-4 w-4" />
          </Button>
          {isQuickFilterVisible && (
            <Input
              value={quickFilterText}
              onChange={(event) => handleQuickFilterChange(event.target.value)}
              placeholder="Search all columns..."
              className="w-64"
              autoFocus
            />
          )}
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
          cacheQuickFilter
          groupMaintainOrder
          popupParent={popupParent}
          onRowClicked={onRowClicked}
        />
      </div>
      {(delayChartData || containerMixData || transportModeData || tradePartyCostData) && selectedCharts.length > 0 && (
        <div
          className={`mt-4 grid gap-4 ${[delayChartData, containerMixData || transportModeData, tradePartyCostData].filter(Boolean).length === 1
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