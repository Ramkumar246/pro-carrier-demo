import { Card } from "@/components/ui/card";
import { Package } from "lucide-react";

interface CargoItem {
  orderNumber: string;
  description: string;
  volume: number;
  weight: number;
  color: string;
}

interface LoadConfigCardProps {
  containerType: string;
  usedVolume: number;
  totalCapacity: number;
  cargoItems: CargoItem[];
}

const LoadConfigCard = ({
  containerType,
  usedVolume,
  totalCapacity,
  cargoItems,
}: LoadConfigCardProps) => {
  const utilizationPercentage = Math.round((usedVolume / totalCapacity) * 100);
  // Use a slightly smaller radius and a larger viewBox so the stroke stays fully inside
  // the SVG bounds and the donut is not visually cropped.
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  
  let currentOffset = 0;
  const segments = cargoItems.map((cargo) => {
    const percentage = (cargo.volume / usedVolume) * 100;
    const segmentLength = (percentage / 100) * circumference;
    const offset = currentOffset;
    currentOffset += segmentLength;
    return { ...cargo, percentage, segmentLength, offset };
  });

  return (
    <Card className="w-full h-fit">
      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-foreground">Load Configuration</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{containerType}</p>
          </div>
          <div className="px-2.5 py-1 bg-primary/10 rounded text-xs font-semibold text-primary">
            {utilizationPercentage}%
          </div>
        </div>

        {/* Chart */}
        <div className="flex items-center justify-center gap-4">
          <div className="relative flex-shrink-0">
            <svg
              className="transform -rotate-90"
              width="100"
              height="100"
              viewBox="0 0 100 100"
            >
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth="10"
              />
              {segments.map((segment, index) => (
                <circle
                  key={index}
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke={segment.color}
                  strokeWidth="10"
                  strokeDasharray={`${segment.segmentLength} ${circumference}`}
                  strokeDashoffset={-segment.offset}
                />
              ))}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <Package className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>

          {/* Stats */}
          <div className="space-y-2">
            <div>
              <p className="text-xs text-muted-foreground">Volume Used</p>
              <p className="text-lg font-bold text-foreground">{usedVolume} m³</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Capacity</p>
              <p className="text-sm font-semibold text-foreground">
                {totalCapacity} m³
              </p>
            </div>
          </div>
        </div>

        {/* Cargo List */}
        <div className="space-y-3 pt-2 border-t">
          {cargoItems.map((item, index) => (
            <div key={index} className="space-y-1">
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs font-semibold text-foreground">{item.orderNumber}</span>
              </div>
              <p className="text-xs text-muted-foreground pl-4">{item.description}</p>
              <div className="grid grid-cols-2 gap-x-6 text-xs pl-4">
                <div>
                  <span className="text-muted-foreground">Vol: </span>
                  <span className="font-medium text-foreground">{item.volume} m³</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Weight: </span>
                  <span className="font-medium text-foreground">{item.weight} kg</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default LoadConfigCard;
