import { useEffect, useRef } from "react";
import * as am5 from "@amcharts/amcharts5";
import * as am5percent from "@amcharts/amcharts5/percent";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import { getCSSVariableColor } from "@/lib/chart-colors";

// Sample data matching mockup exactly - two pie charts side by side
// Left pie (Spend): Dark blue ~72%, Pink ~22%, Teal ~6%
// Right pie (Volume): Dark blue ~62%, Pink ~18%, Teal ~20%
const spendData = [
  { name: "Sea", value: 72 }, // Dark blue - largest
  { name: "Air", value: 22 }, // Pink - medium
  { name: "Road", value: 6 }, // Teal - smallest
];

const volumeData = [
  { name: "Sea", value: 62 }, // Dark blue - largest
  { name: "Air", value: 18 }, // Pink - medium
  { name: "Road", value: 20 }, // Teal - larger than spend
];

interface ShipmentDistributionChartProps {
  type: "spend" | "volume";
}

const ShipmentDistributionChart = ({ type }: ShipmentDistributionChartProps) => {
  const chartRef = useRef<am5percent.PieChart | null>(null);
  const rootRef = useRef<am5.Root | null>(null);
  const data = type === "spend" ? spendData : volumeData;
  const chartId = `shipmentDistributionChart-${type}`;

  useEffect(() => {
    const root = am5.Root.new(chartId);
    rootRef.current = root;

    root.setThemes([am5themes_Animated.new(root)]);

    // Get colors matching mockup
    const color1 = "#2b2a7a"; // Dark blue
    const color2 = "#f85a9d"; // Pink
    const color3 = "#39c7c4"; // Teal
    const cardColor = getCSSVariableColor("--card");
    const borderColor = getCSSVariableColor("--border");
    const foregroundColor = getCSSVariableColor("--foreground");

    const COLORS = [color1, color2, color3];

    const chart = root.container.children.push(
      am5percent.PieChart.new(root, {
        layout: root.verticalLayout,
        innerRadius: am5.percent(50),
      })
    );
    chartRef.current = chart;

    const series = chart.series.push(
      am5percent.PieSeries.new(root, {
        valueField: "value",
        categoryField: "name",
      })
    );

    series.slices.template.setAll({
      strokeWidth: 0,
      tooltipText: "{category}: {value}%",
      fillOpacity: 1,
    });

    series.data.setAll(
      data.map((item, index) => ({
        name: item.name,
        value: item.value,
        fill: am5.color(COLORS[index % COLORS.length]),
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
  }, [type, chartId]);

  return <div id={chartId} style={{ width: "100%", height: "200px" }} />;
};

export default ShipmentDistributionChart;
