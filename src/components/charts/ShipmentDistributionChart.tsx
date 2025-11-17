import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";

const modelData = [
  { name: "Sea", value: 45 },
  { name: "Air", value: 30 },
  { name: "Road", value: 25 },
];

const volumeData = [
  { name: "Large", value: 40 },
  { name: "Medium", value: 35 },
  { name: "Small", value: 25 },
];

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
];

interface ShipmentDistributionChartProps {
  type: "model" | "volume";
}

const ShipmentDistributionChart = ({ type }: ShipmentDistributionChartProps) => {
  const data = type === "model" ? modelData : volumeData;

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
