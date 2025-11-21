import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { ShipmentStatusGroups, TransportMode } from "@/types/shipment";

const STATUS_CONFIG = [
  { key: "inTransit" as const, label: "In Transit" },
  { key: "pending" as const, label: "Pending" },
  { key: "completed" as const, label: "Completed" },
];

const TRANSPORT_MODES: TransportMode[] = ["Sea", "Air", "Road"];
const MODE_COLORS: Record<TransportMode, string> = {
  Sea: "hsl(var(--chart-1))",
  Air: "hsl(var(--chart-2))",
  Road: "hsl(var(--chart-3))",
};

interface ShipmentVolumesChartProps {
  shipmentGroups: ShipmentStatusGroups;
}

const ShipmentVolumesChart = ({ shipmentGroups }: ShipmentVolumesChartProps) => {
  const data = useMemo(() => {
    return STATUS_CONFIG.map(({ key, label }) => {
      const shipments = shipmentGroups[key];
      const totals: Record<TransportMode, number> = { Sea: 0, Air: 0, Road: 0 };

      shipments.forEach((shipment) => {
        totals[shipment.transportMode] += shipment.volumeTeu;
      });

      return {
        status: label,
        ...totals,
      };
    });
  }, [shipmentGroups]);

  const hasData = data.some((entry) => TRANSPORT_MODES.some((mode) => entry[mode] > 0));

  if (!hasData) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        No volume data available.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="status" stroke="hsl(var(--muted-foreground))" fontSize={12} />
        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "0.5rem",
          }}
          formatter={(value: number, name: string) => [`${value.toFixed(1)} TEU`, `${name} Volume`]}
        />
        <Legend />
        {TRANSPORT_MODES.map((mode) => (
          <Bar key={mode} dataKey={mode} fill={MODE_COLORS[mode]} radius={[4, 4, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
};

export default ShipmentVolumesChart;
