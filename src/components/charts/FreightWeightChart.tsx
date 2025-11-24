import { useEffect, useRef } from "react";
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import { getCSSVariableColor } from "@/lib/chart-colors";

// Sample data matching mockup - Total Freight Spend, last 4 quarters (Q4, Q1, Q2, Q3)
// Each quarter has 3 bars, Q1 and Q3 have higher spend than Q4 and Q2
// Dark blue (bottom), Teal (middle), Pink (top)
const data = [
  // Q4 - Lower spend
  { quarter: "Q4", darkBlue: 180, teal: 120, pink: 80 },
  { quarter: "Q4", darkBlue: 200, teal: 140, pink: 100 },
  { quarter: "Q4", darkBlue: 190, teal: 130, pink: 90 },
  // Q1 - Higher spend
  { quarter: "Q1", darkBlue: 280, teal: 180, pink: 130 },
  { quarter: "Q1", darkBlue: 300, teal: 200, pink: 150 },
  { quarter: "Q1", darkBlue: 290, teal: 190, pink: 140 },
  // Q2 - Lower spend
  { quarter: "Q2", darkBlue: 200, teal: 140, pink: 100 },
  { quarter: "Q2", darkBlue: 220, teal: 160, pink: 120 },
  { quarter: "Q2", darkBlue: 210, teal: 150, pink: 110 },
  // Q3 - Higher spend
  { quarter: "Q3", darkBlue: 300, teal: 200, pink: 150 },
  { quarter: "Q3", darkBlue: 320, teal: 220, pink: 170 },
  { quarter: "Q3", darkBlue: 310, teal: 210, pink: 160 },
];

const FreightWeightChart = () => {
  const chartRef = useRef<am5xy.XYChart | null>(null);
  const rootRef = useRef<am5.Root | null>(null);

  useEffect(() => {
    const root = am5.Root.new("freightWeightChart");
    root._logo?.dispose();
    rootRef.current = root;

    root.setThemes([am5themes_Animated.new(root)]);

    // Get colors matching mockup
    const color1 = "#2b2a7a"; // Dark blue (bottom)
    const color2 = "#39c7c4"; // Teal (middle)
    const color3 = "#f85a9d"; // Pink (top)
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
        categoryField: "quarter",
        renderer: am5xy.AxisRendererX.new(root, {
          cellStartLocation: 0.1,
          cellEndLocation: 0.9,
        }),
      })
    );

    const yAxis = chart.yAxes.push(
      am5xy.ValueAxis.new(root, {
        renderer: am5xy.AxisRendererY.new(root, {}),
      })
    );

    // Create stacked column series - Dark Blue (bottom), Teal (middle), Pink (top)
    const darkBlueSeries = chart.series.push(
      am5xy.ColumnSeries.new(root, {
        name: "Dark Blue",
        xAxis: xAxis,
        yAxis: yAxis,
        valueYField: "darkBlue",
        categoryXField: "quarter",
        fill: am5.color(color1),
        stacked: true,
      })
    );

    const tealSeries = chart.series.push(
      am5xy.ColumnSeries.new(root, {
        name: "Teal",
        xAxis: xAxis,
        yAxis: yAxis,
        valueYField: "teal",
        categoryXField: "quarter",
        fill: am5.color(color2),
        stacked: true,
      })
    );

    const pinkSeries = chart.series.push(
      am5xy.ColumnSeries.new(root, {
        name: "Pink",
        xAxis: xAxis,
        yAxis: yAxis,
        valueYField: "pink",
        categoryXField: "quarter",
        fill: am5.color(color3),
        stacked: true,
      })
    );

    // Configure all series
    [darkBlueSeries, tealSeries, pinkSeries].forEach((series) => {
      series.columns.template.setAll({
        cornerRadiusTL: 4,
        cornerRadiusTR: 4,
        strokeOpacity: 0,
      });
    });

    darkBlueSeries.data.setAll(data);
    tealSeries.data.setAll(data);
    pinkSeries.data.setAll(data);
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
    darkBlueSeries.set("tooltip", tooltip);
    tealSeries.set("tooltip", tooltip);
    pinkSeries.set("tooltip", tooltip);

    const legend = chart.children.push(
      am5.Legend.new(root, {
        centerX: am5.p50,
        x: am5.p50,
        marginTop: 15,
        marginBottom: 15,
      })
    );
    legend.data.setAll(chart.series.values);

    // Enhanced animations
    darkBlueSeries.appear(1000, 100);
    tealSeries.appear(1200, 100);
    pinkSeries.appear(1400, 100);
    chart.appear(1000, 100);

    return () => {
      root.dispose();
    };
  }, []);

  return <div id="freightWeightChart" style={{ width: "100%", height: "200px" }} />;
};

export default FreightWeightChart;
