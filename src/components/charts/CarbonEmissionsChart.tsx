import { useEffect, useRef } from "react";
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import { getCSSVariableColor } from "@/lib/chart-colors";

// Sample data matching mockup exactly - last 6 months (Jan-Jun)
// Pink line: starts mid-range, peaks in Feb, dips in Apr, peaks in May, ends mid-range
// Dark blue: starts low in Jan, peaks in Mar, dips in Apr, rises steadily through May and Jun
// Teal: starts mid-range, dips in Feb, peaks in Apr, dips in May, ends low in Jun
const data = [
  { month: "Jan", pink: 130, darkBlue: 90, teal: 120 },
  { month: "Feb", pink: 180, darkBlue: 100, teal: 100 },
  { month: "Mar", pink: 150, darkBlue: 170, teal: 110 },
  { month: "Apr", pink: 120, darkBlue: 140, teal: 175 },
  { month: "May", pink: 190, darkBlue: 160, teal: 130 },
  { month: "Jun", pink: 140, darkBlue: 180, teal: 95 },
];

const CarbonEmissionsChart = () => {
  const chartRef = useRef<am5xy.XYChart | null>(null);
  const rootRef = useRef<am5.Root | null>(null);

  useEffect(() => {
    const root = am5.Root.new("carbonEmissionsChart");
    rootRef.current = root;

    root.setThemes([am5themes_Animated.new(root)]);

    // Get colors from CSS variables - matching mockup colors
    const color1 = "#f85a9d"; // Pink
    const color2 = "#2b2a7a"; // Dark blue
    const color3 = "#39c7c4"; // Teal
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
        categoryField: "month",
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

    // Create 3 line series matching mockup - Pink, Dark Blue, Teal
    const pinkSeries = chart.series.push(
      am5xy.LineSeries.new(root, {
        name: "Pink",
        xAxis: xAxis,
        yAxis: yAxis,
        valueYField: "pink",
        categoryXField: "month",
        stroke: am5.color(color1),
        fill: am5.color(color1),
      })
    );

    const darkBlueSeries = chart.series.push(
      am5xy.LineSeries.new(root, {
        name: "Dark Blue",
        xAxis: xAxis,
        yAxis: yAxis,
        valueYField: "darkBlue",
        categoryXField: "month",
        stroke: am5.color(color2),
        fill: am5.color(color2),
      })
    );

    const tealSeries = chart.series.push(
      am5xy.LineSeries.new(root, {
        name: "Teal",
        xAxis: xAxis,
        yAxis: yAxis,
        valueYField: "teal",
        categoryXField: "month",
        stroke: am5.color(color3),
        fill: am5.color(color3),
      })
    );

    // Configure all series with smooth curves and bullets
    [pinkSeries, darkBlueSeries, tealSeries].forEach((series) => {
      series.strokes.template.setAll({
        strokeWidth: 2,
      });

      series.bullets.push(() => {
        return am5.Bullet.new(root, {
          sprite: am5.Circle.new(root, {
            radius: 4,
            fill: series.get("fill"),
          }),
        });
      });
    });

    pinkSeries.data.setAll(data);
    darkBlueSeries.data.setAll(data);
    tealSeries.data.setAll(data);
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
    pinkSeries.set("tooltip", tooltip);
    darkBlueSeries.set("tooltip", tooltip);
    tealSeries.set("tooltip", tooltip);

    // Enhanced animations
    pinkSeries.appear(1000, 100);
    darkBlueSeries.appear(1200, 100);
    tealSeries.appear(1400, 100);
    chart.appear(1000, 100);

    return () => {
      root.dispose();
    };
  }, []);

  return <div id="carbonEmissionsChart" style={{ width: "100%", height: "200px" }} />;
};

export default CarbonEmissionsChart;
