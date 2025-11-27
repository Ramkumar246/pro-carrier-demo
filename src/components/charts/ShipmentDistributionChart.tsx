import { useEffect, useMemo, useRef } from "react";
import * as am5 from "@amcharts/amcharts5";
import * as am5percent from "@amcharts/amcharts5/percent";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import { getCSSVariableColor } from "@/lib/chart-colors";
import { shipmentData } from "@/data/shipments";
import type { Shipment } from "@/types/shipment";
import type { CrossFilterMode } from "@/pages/Index";

const COLORS = {
  Sea: "#212063", // Dark blue
  Air: "#4DD3C9", // Teal
  Road: "#FF2C7D", // Pink
};

const getShipmentVolume = (shipment: Shipment) => {
  const rawValue =
    (shipment as any).volume ??
    shipment.volumeTeu ??
    shipment.containers ??
    0;
  const numericValue = Number(rawValue);
  return Number.isFinite(numericValue) ? numericValue : 0;
};

const useTransportModeData = () => {
  return useMemo(() => {
    const allShipments: Shipment[] = [
      ...shipmentData.inTransit,
      ...shipmentData.completed,
      ...shipmentData.pending,
    ];

    const volumes = {
      Sea: 0,
      Air: 0,
      Road: 0,
    };

    allShipments.forEach((shipment) => {
      const mode = shipment.transportMode;
      if (mode === "Sea" || mode === "Air" || mode === "Road") {
        volumes[mode] += getShipmentVolume(shipment);
      }
    });

    const total = volumes.Sea + volumes.Air + volumes.Road;
    if (total === 0) return [];

    return [
      {
        name: "Sea",
        value: Number(volumes.Sea.toFixed(2)),
        percentage: Math.round((volumes.Sea / total) * 100),
        fill: am5.color(COLORS.Sea),
      },
      {
        name: "Air",
        value: Number(volumes.Air.toFixed(2)),
        percentage: Math.round((volumes.Air / total) * 100),
        fill: am5.color(COLORS.Air),
      },
      {
        name: "Road",
        value: Number(volumes.Road.toFixed(2)),
        percentage: Math.round((volumes.Road / total) * 100),
        fill: am5.color(COLORS.Road),
      },
    ];
  }, []);
};

interface ShipmentDistributionChartProps {
  crossFilterMode?: CrossFilterMode;
  onCrossFilterChange?: (mode: CrossFilterMode) => void;
}

const ShipmentDistributionChart = ({ crossFilterMode, onCrossFilterChange }: ShipmentDistributionChartProps) => {
  const chartRef = useRef<am5percent.PieChart | null>(null);
  const rootRef = useRef<am5.Root | null>(null);
  const chartData = useTransportModeData();
  const chartId = "shipmentDistributionChart";

  useEffect(() => {
    if (!chartData.length) return;

    const root = am5.Root.new(chartId);
    root._logo?.dispose();
    rootRef.current = root;

    root.setThemes([am5themes_Animated.new(root)]);

    const cardColor = getCSSVariableColor("--card");
    const borderColor = getCSSVariableColor("--border");
    const foregroundColor = getCSSVariableColor("--foreground");

    const chart = root.container.children.push(
      am5percent.PieChart.new(root, {
        layout: root.verticalLayout,
        innerRadius: am5.percent(50),
      })
    );
    chartRef.current = chart;

    // Remove any borders from chart container
    chart.get("background")?.setAll({
      strokeWidth: 0,
      strokeOpacity: 0,
    });

    const series = chart.series.push(
      am5percent.PieSeries.new(root, {
        valueField: "value",
        categoryField: "name",
      })
    );

    // Create and configure tooltip for all slices BEFORE setting data
    const tooltip = am5.Tooltip.new(root, {
      getFillFromSprite: false,
      autoTextColor: false,
      pointerOrientation: "horizontal",
      animationDuration: 200,
    });

    // Set tooltip background with high opacity and ensure it's visible
    const tooltipBg = tooltip.get("background");
    if (tooltipBg) {
      tooltipBg.setAll({
        fill: am5.color(cardColor),
        fillOpacity: 1,
        stroke: am5.color(borderColor),
        strokeWidth: 1,
      });
    }

    // Explicitly set tooltip label color to ensure visibility for all modes
    tooltip.label.setAll({
      fill: am5.color(foregroundColor),
      fillOpacity: 1,
      fontSize: 12,
    });

    // Force tooltip to always show text
    tooltip.label.adapters.add("text", (text) => {
      return text || "";
    });

    // Apply tooltip to series template BEFORE setting other properties
    series.slices.template.set("tooltip", tooltip);

    // Set colors for each slice based on category and apply cross-filter opacity
    series.slices.template.adapters.add("fill", (fill, target) => {
      const dataItem = target.dataItem;
      if (!dataItem) return fill;
      const dataContext = dataItem.dataContext as { name: string };
      const category = dataContext?.name;
      if (category && COLORS[category as keyof typeof COLORS]) {
        return am5.color(COLORS[category as keyof typeof COLORS]);
      }
      return fill;
    });
    
    // Apply opacity based on cross-filter
    series.slices.template.adapters.add("fillOpacity", (opacity, target) => {
      if (!crossFilterMode) return 1;
      const dataItem = target.dataItem;
      if (!dataItem) return opacity;
      const dataContext = dataItem.dataContext as { name: string };
      const category = dataContext?.name;
      return category === crossFilterMode ? 1 : 0.15;
    });

    series.slices.template.setAll({
      strokeWidth: 0,
      strokeOpacity: 0,
      fillOpacity: 1,
      tooltipText: "{category}: {value} TEU",
      cursorOverStyle: "pointer",
    });
    
    // Add click handler for cross-filtering
    series.slices.template.events.on("click", (ev) => {
      const dataItem = ev.target.dataItem;
      if (!dataItem) return;
      const dataContext = dataItem.dataContext as { name: string };
      const mode = dataContext?.name as CrossFilterMode;
      if (mode) {
        onCrossFilterChange?.(mode);
      }
    });

    series.data.setAll(chartData);

    series.labels.template.setAll({
      textType: "circular",
      centerX: 0,
      centerY: 0,
      fontSize: 11,
    });

    // Ensure tooltip container is on top layer
    if (root.tooltipContainer) {
      root.tooltipContainer.toFront();
    }

    const legend = chart.children.push(
      am5.Legend.new(root, {
        centerX: am5.p50,
        x: am5.p50,
        marginTop: 10,
        marginBottom: 0,
        layout: root.horizontalLayout,
      })
    );
    legend.data.setAll(series.dataItems);
    legend.valueLabels.template.setAll({
      forceHidden: true,
    });
    legend.labels.template.setAll({
      fontSize: 11,
      fill: am5.color(foregroundColor),
      maxWidth: 50,
      oversizedBehavior: "truncate",
    });
    legend.markers.template.setAll({
      width: 10,
      height: 10,
    });

    // Enhanced animations
    series.appear(1000, 100);
    chart.appear(1000, 100);

    return () => {
      root.dispose();
    };
  }, [chartData, chartId, crossFilterMode, onCrossFilterChange]);

  if (!chartData.length) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
        No transport mode data available.
      </div>
    );
  }

  return <div id={chartId} style={{ width: "100%", height: "200px" }} />;
};

export default ShipmentDistributionChart;
