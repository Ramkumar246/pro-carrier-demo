import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { ShipmentStatusGroups } from "@/types/shipment";

const STATUS_CONFIG = [
  { key: "inTransit" as const, label: "In Transit" },
  { key: "pending" as const, label: "Pending" },
  { key: "completed" as const, label: "Completed" },
];

interface CarbonEmissionsChartProps {
  shipmentGroups: ShipmentStatusGroups;
}

const CarbonEmissionsChart = ({ shipmentGroups }: CarbonEmissionsChartProps) => {
  const data = useMemo(() => {
    return STATUS_CONFIG.map(({ key, label }) => {
      const shipments = shipmentGroups[key];
      const total = shipments.reduce((sum, shipment) => sum + (shipment.carbonEmissions || 0), 0);
      return { label, value: Number(total.toFixed(2)) };
    }).filter((item) => item.value > 0);
  }, [shipmentGroups]);

  if (!data.length) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        No emission data available.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} />
        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "0.5rem",
          }}
          formatter={(value: number) => [`${value} tCO₂e`, "Emissions"]}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke="hsl(var(--chart-1))"
          strokeWidth={2}
          dot={{ fill: "hsl(var(--chart-1))" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default CarbonEmissionsChart;
