import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";
import type { Shipment } from "@/types/shipment";

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-6))",
];

interface ShipmentDistributionChartProps {
  type: "model" | "volume";
  shipments: Shipment[];
}

const ShipmentDistributionChart = ({ type, shipments }: ShipmentDistributionChartProps) => {
  const data = useMemo(() => {
    if (type === "model") {
      const totals = shipments.reduce<Record<string, number>>((acc, shipment) => {
        acc[shipment.transportMode] = (acc[shipment.transportMode] || 0) + 1;
        return acc;
      }, {});

      return Object.entries(totals).map(([name, value]) => ({ name, value }));
    }

    const containerTotals = shipments.reduce<Record<string, number>>((acc, shipment) => {
      acc[shipment.containerMode] = (acc[shipment.containerMode] || 0) + shipment.volumeTeu;
      return acc;
    }, {});

    return Object.entries(containerTotals).map(([name, value]) => ({ name, value }));
  }, [shipments, type]);

  if (!data.length) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        No distribution data available.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          fill="#8884d8"
          paddingAngle={5}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Legend
          verticalAlign="bottom"
          height={36}
          formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default ShipmentDistributionChart;
