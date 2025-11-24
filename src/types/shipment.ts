export type TransportMode = "Sea" | "Air" | "Road";

export type ContainerMode = "FCL" | "LCL" | "ROR" | "LSE" | "LTL" | "FTL";

export interface Shipment {
  id: string;
  status: string;
  origin: string;
  route: string;
  transportMode: TransportMode;
  departure: string; // Planned departure (ETD)
  departureActualDate: string | null; // Actual departure (ATD)
  arrival: string; // Planned arrival (ETA)
  arrivalActualDate: string | null; // Actual arrival (ATA)
  delivery: string; // Planned delivery date
  deliveryActualDate: string | null; // Actual delivery date
  pickup: string; // Planned pickup date
  pickupActualDate: string | null; // Actual pickup date
  tradeParty: string;
  grossWeight: number;
  volumeTeu: number;
  containers: number;
  costUsd: number;
  containerMode: ContainerMode;
  emissionCo2eKg?: number; // Total CO₂e emissions in kg (only for in-transit and completed shipments)
}

