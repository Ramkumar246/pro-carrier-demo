import { useEffect, useMemo, useRef } from "react";
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import { getCSSVariableColor } from "@/lib/chart-colors";
import { shipmentData } from "@/data/shipments";
import type { Shipment } from "@/types/shipment";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

type AggregatedMonth = {
  key: string;
  monthIndex: number;
  monthLabel: string;
  year: number;
  sea: number;
  air: number;
  road: number;
};

const MODE_MAP: Record<string, keyof Pick<AggregatedMonth, "sea" | "air" | "road"> | undefined> = {
  SEA: "sea",
  Sea: "sea",
  sea: "sea",
  AIR: "air",
  Air: "air",
  air: "air",
  ROAD: "road",
  Road: "road",
  road: "road",
  ROA: "road",
};

const COLORS = {
  sea: "#212063",
  air: "#4DD3C9",
  road: "#FF2C7D",
};

const parseDepartureDate = (value: string | null | undefined) => {
  if (!value) return null;
  const iso = new Date(value);
  if (!Number.isNaN(iso.getTime())) return iso;

  const parts = value.split("/");
  if (parts.length === 3) {
    const [day, month, year] = parts.map((part) => Number(part));
    if (!Number.isNaN(day) && !Number.isNaN(month) && !Number.isNaN(year)) {
      return new Date(year, month - 1, day);
    }
  }
  return null;
};

const buildLast12MonthBuckets = (shipments: Shipment[]): AggregatedMonth[] => {
  const parsedDates = shipments
    .map((shipment) => parseDepartureDate(shipment.departure))
    .filter((date): date is Date => !!date);

  const latestDate = parsedDates.length
    ? parsedDates.reduce((latest, date) => (date > latest ? date : latest), parsedDates[0])
    : new Date();

  const buckets: AggregatedMonth[] = [];
  for (let offset = 11; offset >= 0; offset--) {
    const bucketDate = new Date(latestDate.getFullYear(), latestDate.getMonth() - offset, 1);
    const monthIndex = bucketDate.getMonth();
    const year = bucketDate.getFullYear();
    buckets.push({
      key: `${year}-${monthIndex}`,
      monthIndex,
      monthLabel: MONTH_LABELS[monthIndex],
      year,
      sea: 0,
      air: 0,
      road: 0,
    });
  }
  return buckets;
};

const aggregateShipmentCosts = (shipments: Shipment[]): AggregatedMonth[] => {
  const buckets = buildLast12MonthBuckets(shipments);
  const bucketMap = new Map(buckets.map((bucket) => [bucket.key, bucket]));

  shipments.forEach((shipment) => {
    const departureDate = parseDepartureDate(shipment.departure);
    if (!departureDate) return;

    const key = `${departureDate.getFullYear()}-${departureDate.getMonth()}`;
    const bucket = bucketMap.get(key);
    if (!bucket) return;

    const modeKey = MODE_MAP[(shipment.transportMode as string) ?? ""];
    if (!modeKey) return;

    const costValue = shipment.costUsd ?? 0;
    if (!costValue) return;

    bucket[modeKey] += Number(costValue);
  });

  return buckets;
};

const useShipmentCostsData = () => {
  return useMemo(() => {
    const allShipments: Shipment[] = [
      ...shipmentData.inTransit,
      ...shipmentData.completed,
      ...shipmentData.pending,
    ];
    return aggregateShipmentCosts(allShipments);
  }, []);
};

const FreightWeightChart = () => {
  const chartRef = useRef<am5xy.XYChart | null>(null);
  const rootRef = useRef<am5.Root | null>(null);
  const chartData = useShipmentCostsData();

  useEffect(() => {
    if (!chartData.length) return;

    const root = am5.Root.new("freightWeightChart");
    root._logo?.dispose();
    rootRef.current = root;

    root.setThemes([am5themes_Animated.new(root)]);

    const cardColor = getCSSVariableColor("--card");
    const borderColor = getCSSVariableColor("--border");
    const foregroundColor = getCSSVariableColor("--foreground");
    const mutedColor = getCSSVariableColor("--muted-foreground");

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

    const xAxisRenderer = am5xy.AxisRendererX.new(root, {
      minGridDistance: 20,
    });
    xAxisRenderer.grid.template.setAll({
      stroke: am5.color("rgba(33,32,99,0.08)"),
    });

    const xAxis = chart.xAxes.push(
      am5xy.CategoryAxis.new(root, {
        categoryField: "key",
        renderer: xAxisRenderer,
      })
    );

    xAxis.data.setAll(chartData);

    xAxisRenderer.labels.template.adapters.add("text", (text, target) => {
      const dataItem = target.dataItem;
      if (!dataItem) return text;
      const context = dataItem.dataContext as AggregatedMonth;
      return context.monthLabel;
    });

    xAxisRenderer.labels.template.setAll({
      fill: am5.color(foregroundColor),
      fontSize: 12,
      textAlign: "center",
    });

    const yAxis = chart.yAxes.push(
      am5xy.ValueAxis.new(root, {
        renderer: am5xy.AxisRendererY.new(root, {
          minGridDistance: 30,
          strokeOpacity: 0.2,
        }),
        min: 0,
      })
    );

    yAxis.get("renderer").labels.template.setAll({
      fill: am5.color(mutedColor),
      fontSize: 12,
    });

    // Format Y-axis labels as currency
    yAxis.set(
      "numberFormatter",
      am5.NumberFormatter.new(root, {
        numberFormat: "$#,###",
      })
    );

    const makeSeries = (
      name: string,
      field: keyof AggregatedMonth,
      color: string,
      isTopStack: boolean = false
    ) => {
      const series = chart.series.push(
        am5xy.ColumnSeries.new(root, {
          name,
          xAxis,
          yAxis,
          valueYField: field as string,
          categoryXField: "key",
          stacked: true,
        })
      );

      const columnTemplate = {
        strokeOpacity: 0,
        fill: am5.color(color),
        tooltipText: `${name} ({monthLabel}): $` + `{valueY.formatNumber('#,###')}`,
        tooltipY: 0,
      };

      // Only apply corner radius to the top stack (Road series)
      if (isTopStack) {
        (columnTemplate as any).cornerRadiusTL = 4;
        (columnTemplate as any).cornerRadiusTR = 4;
      }

      series.columns.template.setAll(columnTemplate);

      series.data.setAll(chartData);
      series.appear(1000, 100);
      return series;
    };

    makeSeries("Sea", "sea", COLORS.sea, false);
    makeSeries("Air", "air", COLORS.air, false);
    makeSeries("Road", "road", COLORS.road, true);

    chart.set(
      "cursor",
      am5xy.XYCursor.new(root, {
        lineY: am5.Line.new(root, {
          strokeOpacity: 0,
        }),
      })
    );

    const legend = chart.children.push(
      am5.Legend.new(root, {
        centerX: am5.p50,
        x: am5.p50,
        marginTop: 10,
        marginBottom: 0,
        layout: root.horizontalLayout,
      })
    );
    legend.data.setAll(chart.series.values);
    legend.labels.template.setAll({
      fontSize: 12,
      fill: am5.color(foregroundColor),
    });

    chart.appear(1000, 100);

    return () => {
      root.dispose();
    };
  }, [chartData]);

  if (!chartData.length) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
        No freight spend data available.
      </div>
    );
  }

  return <div id="freightWeightChart" style={{ width: "100%", height: "220px" }} />;
};

export default FreightWeightChart;
