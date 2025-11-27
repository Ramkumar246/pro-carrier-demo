import { useEffect, useRef } from "react";
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import { getCSSVariableColor } from "@/lib/chart-colors";
import type { CrossFilterMode } from "@/pages/Index";

// Sample data for last 6 months - Spline graph with weight/emissions on Y-axis, months on X-axis
// Values stay within 0-600 kg so we can highlight every 100 kg tick on the axis
const data = [
  { month: "Jul", sea: 420, road: 260, air: 220 },
  { month: "Aug", sea: 460, road: 280, air: 240 },
  { month: "Sep", sea: 520, road: 310, air: 260 },
  { month: "Oct", sea: 480, road: 290, air: 240 },
  { month: "Nov", sea: 550, road: 330, air: 270 },
  { month: "Dec", sea: 510, road: 300, air: 250 },
];

interface CarbonEmissionsChartProps {
  crossFilterMode?: CrossFilterMode;
  onCrossFilterChange?: (mode: CrossFilterMode) => void;
}

const CarbonEmissionsChart = ({ crossFilterMode, onCrossFilterChange }: CarbonEmissionsChartProps) => {
  const chartRef = useRef<am5xy.XYChart | null>(null);
  const rootRef = useRef<am5.Root | null>(null);

  useEffect(() => {
    const root = am5.Root.new("carbonEmissionsChart");
    rootRef.current = root;

    root.setThemes([am5themes_Animated.new(root)]);
    root._logo?.dispose();

    // Get colors matching mockup - Sea (dark blue), Road (pink), Air (teal)
    const seaColor = "#2b2a7a"; // Dark blue
    const roadColor = "#f85a9d"; // Pink
    const airColor = "#39c7c4"; // Teal
    const cardColor = getCSSVariableColor("--card");
    const borderColor = getCSSVariableColor("--border");
    const foregroundColor = getCSSVariableColor("--foreground");
    const axisLabelColor = getCSSVariableColor("--muted-foreground");

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

    // X-axis: Months (last 6 months)
    const xAxis = chart.xAxes.push(
      am5xy.CategoryAxis.new(root, {
        categoryField: "month",
        renderer: am5xy.AxisRendererX.new(root, {
          cellStartLocation: 0.1,
          cellEndLocation: 0.9,
          minGridDistance: 15,
        }),
      })
    );

    xAxis.get("renderer").labels.template.setAll({
      fill: am5.color(axisLabelColor),
      fontSize: 12,
    });

    // Y-axis: Weight/Emissions
    const yAxisRenderer = am5xy.AxisRendererY.new(root, {
      minGridDistance: 20,
    });
    const yAxis = chart.yAxes.push(
      am5xy.ValueAxis.new(root, {
        renderer: yAxisRenderer,
        min: 200,
        max: 600,
        strictMinMax: true,
        numberFormat: "#' kg'",
        extraMin: 0,
        extraMax: 0,
      })
    );
    yAxisRenderer.labels.template.setAll({
      fill: am5.color(axisLabelColor),
      fontSize: 12,
    });
    yAxis.set(
      "numberFormatter",
      am5.NumberFormatter.new(root, {
        numberFormat: "#' kg'",
      })
    );

    const createSeries = (name: string, field: keyof typeof data[number], color: string) => {
      const valueField = field as keyof (typeof data)[number];

      const series = chart.series.push(
        am5xy.SmoothedXLineSeries.new(root, {
          name,
          xAxis: xAxis,
          yAxis: yAxis,
          valueYField: valueField as string,
          categoryXField: "month",
          stroke: am5.color(color),
          fill: am5.color(color),
        })
      );

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
      
      // Create and configure tooltip with explicit text color
      const tooltip = am5.Tooltip.new(root, {
        getFillFromSprite: false,
        autoTextColor: false,
        pointerOrientation: "horizontal",
        labelText: `${name}: {valueY.formatNumber('#,###.##')} kg`,
      });
      
      tooltip.get("background")?.setAll({
        fill: am5.color(cardColor),
        fillOpacity: 1,
        stroke: am5.color(borderColor),
        strokeWidth: 1,
      });
      
      tooltip.label.setAll({
        fill: am5.color(foregroundColor),
        fillOpacity: 1,
        fontSize: 12,
      });
      
      series.set("tooltip", tooltip);

      return series;
    };

    // Create 3 spline series - Sea, Road, Air
    const seaSeries = createSeries("Sea", "sea", seaColor);
    const roadSeries = createSeries("Road", "road", roadColor);
    const airSeries = createSeries("Air", "air", airColor);

    seaSeries.data.setAll(data);
    roadSeries.data.setAll(data);
    airSeries.data.setAll(data);
    xAxis.data.setAll(data);
    
    // Add click events for cross-filtering
    const addClickHandler = (series: am5xy.SmoothedXLineSeries, mode: CrossFilterMode) => {
      series.strokes.template.events.on("click", () => {
        onCrossFilterChange?.(mode);
      });
      series.strokes.template.set("cursorOverStyle", "pointer");
      // Add click on bullet circles via bulletsContainer
      series.bulletsContainer.children.each((bullet) => {
        bullet.events.on("click", () => {
          onCrossFilterChange?.(mode);
        });
      });
    };
    
    addClickHandler(seaSeries, "Sea");
    addClickHandler(roadSeries, "Road");
    addClickHandler(airSeries, "Air");
    
    // Apply cross-filter visual state - dim non-selected series
    const applyFilterState = () => {
      const allSeries = [
        { series: seaSeries, mode: "Sea" },
        { series: roadSeries, mode: "Road" },
        { series: airSeries, mode: "Air" },
      ];
      
      allSeries.forEach(({ series, mode }) => {
        if (!crossFilterMode || crossFilterMode === mode) {
          series.strokes.template.setAll({ strokeOpacity: 1 });
        } else {
          series.strokes.template.setAll({ strokeOpacity: 0.15 });
        }
      });
    };
    
    applyFilterState();
    const cursor = chart.set("cursor", am5xy.XYCursor.new(root, {}));
    cursor.set("snapToSeries", [seaSeries, roadSeries, airSeries]);
    cursor.get("tooltip")?.set("forceHidden", true);
    cursor.lineX.setAll({ strokeOpacity: 0.1 });
    cursor.lineY.setAll({ strokeOpacity: 0.1 });

    // Add legend with responsive layout
    const legend = chart.children.push(
      am5.Legend.new(root, {
        centerX: am5.p50,
        x: am5.p50,
        centerY: am5.p50,
        layout: root.horizontalLayout,
        marginTop: 5,
        paddingTop: 5,
      })
    );
    legend.labels.template.setAll({
      fontSize: 11,
      maxWidth: 60,
      oversizedBehavior: "truncate",
      marginLeft: 2,
    });
    legend.markers.template.setAll({
      width: 10,
      height: 10,
    });
    legend.itemContainers.template.setAll({
      marginLeft: 5,
      marginRight: 5,
    });
    legend.data.setAll(chart.series.values);

    // Enhanced animations with staggered timing
    seaSeries.appear(1000, 100);
    roadSeries.appear(1200, 100);
    airSeries.appear(1400, 100);
    chart.appear(1000, 100);

    return () => {
      root.dispose();
    };
  }, [crossFilterMode, onCrossFilterChange]);

  return <div id="carbonEmissionsChart" style={{ width: "100%", height: "230px", cursor: "pointer" }} />;
};

export default CarbonEmissionsChart;
