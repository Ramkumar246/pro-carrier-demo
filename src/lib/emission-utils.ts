import type { TransportMode, ContainerMode } from "@/types/shipment";

/**
 * Get emission value based on transport mode and container mode
 * Based on sample data table provided
 * Returns one of the exact values from the sample table
 */
export const getEmissionValue = (
  transportMode: TransportMode,
  containerMode: ContainerMode
): number => {
  // Map transport mode to table format
  const modeMap: Record<TransportMode, string> = {
    Sea: "SEA",
    Air: "AIR",
    Road: "ROA",
  };

  const mode = modeMap[transportMode] || transportMode;

  // Exact emission values from sample data table
  const emissionValues: Record<string, Record<string, number[]>> = {
    ROA: {
      LTL: [0.139, 0.367, 0.719],
      FTL: [0.367], // Using LTL value as reference
    },
    AIR: {
      LSE: [0.515, 0.99, 1.495],
    },
    SEA: {
      LCL: [0.699, 0.91, 1000.136, 1002.238],
      FCL: [100.291, 1001.69],
      ROR: [100.291], // Similar to FCL
    },
  };

  // Get array of possible values
  const values = emissionValues[mode]?.[containerMode];

  if (values && values.length > 0) {
    // Return a random value from the array to add variety
    return values[Math.floor(Math.random() * values.length)];
  }

  // Default values if combination not found
  if (mode === "SEA" && containerMode === "ROR") {
    return 100.291; // Similar to FCL
  }

  // Default fallback
  return 0;
};

