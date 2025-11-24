import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { month: "Jan", sea: 120, air: 90, road: 60 },
  { month: "Feb", sea: 130, air: 100, road: 70 },
  { month: "Mar", sea: 125, air: 95, road: 65 },
  { month: "Apr", sea: 140, air: 110, road: 80 },
  { month: "May", sea: 150, air: 120, road: 85 },
  { month: "Jun", sea: 160, air: 130, road: 90 },
];

const FreightWeightChart = () => {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: "hsl(var(--card))", 
            border: "1px solid hsl(var(--border))",
            borderRadius: "0.5rem"
          }} 
        />
        <Bar dataKey="sea" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
        <Bar dataKey="air" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
        <Bar dataKey="road" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default FreightWeightChart;
