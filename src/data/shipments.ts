import type { Shipment, TransportMode } from "@/types/shipment";

export type TransportFilter = TransportMode | "All";

export const transportFilterOptions: { label: string; value: TransportFilter }[] = [
  { label: "Sea Freight", value: "Sea" },
  { label: "Air Freight", value: "Air" },
  { label: "Road Freight", value: "Road" },
  { label: "All", value: "All" },
];

export const shipmentData = {
  inTransit: [
    {
      id: "PC#2025-084406",
      status: "Out for Delivery",
      origin: "N/A",
      route: "Shanghai → Felixstowe",
      transportMode: "Sea" as TransportMode,
      departure: "16/09/2025",
      departureActualDate: "17/09/2025", // 1 day delay
      arrival: "18/10/2025",
      arrivalActualDate: null, // Not yet arrived
      delivery: "18/10/2025",
      deliveryActualDate: "20/10/2025", // 2 days delay
      pickup: "15/09/2025",
      pickupActualDate: "15/09/2025", // On time
      tradeParty: "XYZ Shipper China",
      grossWeight: 12800,
      volumeTeu: 4,
      containers: 3,
      costUsd: 82000,
    },
    {
      id: "PC#2025-084407",
      status: "Booked for Delivery",
      origin: "N/A",
      route: "Felixstowe → Auckland",
      transportMode: "Sea" as TransportMode,
      departure: "16/09/2025",
      departureActualDate: "16/09/2025", // On time
      arrival: "20/10/2025",
      arrivalActualDate: null, // Not yet arrived
      delivery: "24/10/2025",
      deliveryActualDate: null, // Not yet delivered
      pickup: "15/09/2025",
      pickupActualDate: "16/09/2025", // 1 day delay
      tradeParty: "ABC Buyer New Zealand",
      grossWeight: 9800,
      volumeTeu: 3,
      containers: 2,
      costUsd: 61000,
    },
    {
      id: "PC#2025-084408",
      status: "Awaiting Arrival",
      origin: "N/A",
      route: "Shanghai → Felixstowe",
      transportMode: "Sea" as TransportMode,
      departure: "18/09/2025",
      departureActualDate: "18/09/2025", // On time
      arrival: "22/10/2025",
      arrivalActualDate: null, // Not yet arrived
      delivery: "24/10/2025",
      deliveryActualDate: null, // Not yet delivered
      pickup: "17/09/2025",
      pickupActualDate: "17/09/2025", // On time
      tradeParty: "XYZ Shipper China",
      grossWeight: 11250,
      volumeTeu: 3,
      containers: 2,
      costUsd: 70050,
    },
    {
      id: "PC#2025-084409",
      status: "Awaiting Arrival",
      origin: "N/A",
      route: "Felixstowe → Auckland",
      transportMode: "Sea" as TransportMode,
      departure: "18/09/2025",
      departureActualDate: "19/09/2025", // 1 day delay
      arrival: "25/10/2025",
      arrivalActualDate: null, // Not yet arrived
      delivery: "27/10/2025",
      deliveryActualDate: null, // Not yet delivered
      pickup: "17/09/2025",
      pickupActualDate: "19/09/2025", // 2 days delay
      tradeParty: "ABC Buyer New Zealand",
      grossWeight: 15000,
      volumeTeu: 5,
      containers: 4,
      costUsd: 98000,
    },
    {
      id: "PC#2025-084410",
      status: "Booked for Delivery",
      origin: "N/A",
      route: "Shanghai → Felixstowe",
      transportMode: "Sea" as TransportMode,
      departure: "20/09/2025",
      departureActualDate: "21/09/2025", // 1 day delay
      arrival: "29/10/2025",
      arrivalActualDate: null, // Not yet arrived
      delivery: "30/10/2025",
      deliveryActualDate: null, // Not yet delivered
      pickup: "19/09/2025",
      pickupActualDate: "19/09/2025", // On time
      tradeParty: "XYZ Shipper China",
      grossWeight: 13200,
      volumeTeu: 4,
      containers: 3,
      costUsd: 86000,
    },
    {
      id: "PC#2025-084411",
      status: "Out for Delivery",
      origin: "N/A",
      route: "Felixstowe → Auckland",
      transportMode: "Sea" as TransportMode,
      departure: "22/09/2025",
      departureActualDate: "23/09/2025", // 1 day delay
      arrival: "01/11/2025",
      arrivalActualDate: null, // Not yet arrived
      delivery: "04/11/2025",
      deliveryActualDate: null, // Not yet delivered
      pickup: "21/09/2025",
      pickupActualDate: "22/09/2025", // 1 day delay
      tradeParty: "ABC Buyer New Zealand",
      grossWeight: 10600,
      volumeTeu: 3,
      containers: 2,
      costUsd: 64000,
    },
    {
      id: "PC#2025-084412",
      status: "Awaiting Arrival",
      origin: "N/A",
      route: "Doha → Frankfurt",
      transportMode: "Air" as TransportMode,
      departure: "24/09/2025",
      departureActualDate: "24/09/2025", // On time
      arrival: "25/09/2025",
      arrivalActualDate: null, // Not yet arrived
      delivery: "26/09/2025",
      deliveryActualDate: null, // Not yet delivered
      pickup: "23/09/2025",
      pickupActualDate: "23/09/2025", // On time
      tradeParty: "Middle East Logistics",
      grossWeight: 3200,
      volumeTeu: 1,
      containers: 0,
      costUsd: 28000,
    },
    {
      id: "PC#2025-084413",
      status: "Out for Delivery",
      origin: "N/A",
      route: "Warsaw → Munich",
      transportMode: "Road" as TransportMode,
      departure: "23/09/2025",
      departureActualDate: "23/09/2025", // On time
      arrival: "27/09/2025",
      arrivalActualDate: "27/09/2025", // On time
      delivery: "27/09/2025",
      deliveryActualDate: "28/09/2025", // 1 day delay
      pickup: "22/09/2025",
      pickupActualDate: "23/09/2025", // 1 day delay
      tradeParty: "EU Auto Parts",
      grossWeight: 7800,
      volumeTeu: 2,
      containers: 0,
      costUsd: 21000,
    },
  ] as Shipment[],
  pending: [
    {
      id: "PN#2025-010001",
      status: "Pending Confirmation",
      origin: "N/A",
      route: "Shanghai → Felixstowe",
      transportMode: "Sea" as TransportMode,
      departure: "04/10/2025",
      departureActualDate: null,
      arrival: "12/11/2025",
      arrivalActualDate: null,
      delivery: "14/11/2025",
      deliveryActualDate: null, // Not yet delivered
      pickup: "03/10/2025",
      pickupActualDate: null, // Not yet picked up
      tradeParty: "XYZ Shipper China",
      grossWeight: 8900,
      volumeTeu: 3,
      containers: 2,
      costUsd: 56000,
    },
    {
      id: "PN#2025-010002",
      status: "Pending Documents",
      origin: "N/A",
      route: "Felixstowe → Auckland",
      transportMode: "Sea" as TransportMode,
      departure: "06/10/2025",
      departureActualDate: null,
      arrival: "16/11/2025",
      arrivalActualDate: null,
      delivery: "18/11/2025",
      deliveryActualDate: null, // Not yet delivered
      pickup: "05/10/2025",
      pickupActualDate: "05/10/2025", // On time
      tradeParty: "ABC Buyer New Zealand",
      grossWeight: 10200,
      volumeTeu: 3,
      containers: 2,
      costUsd: 62000,
    },
    {
      id: "PN#2025-010003",
      status: "Pending Inspection",
      origin: "N/A",
      route: "Shanghai → Felixstowe",
      transportMode: "Sea" as TransportMode,
      departure: "10/10/2025",
      departureActualDate: null,
      arrival: "20/11/2025",
      arrivalActualDate: null,
      delivery: "22/11/2025",
      deliveryActualDate: null, // Not yet delivered
      pickup: "09/10/2025",
      pickupActualDate: "11/10/2025", // 2 days delay
      tradeParty: "XYZ Shipper China",
      grossWeight: 9400,
      volumeTeu: 3,
      containers: 2,
      costUsd: 60000,
    },
    {
      id: "PN#2025-010004",
      status: "Pending Capacity",
      origin: "N/A",
      route: "Singapore → Los Angeles",
      transportMode: "Air" as TransportMode,
      departure: "08/10/2025",
      departureActualDate: null,
      arrival: "09/10/2025",
      arrivalActualDate: null,
      delivery: "10/10/2025",
      deliveryActualDate: null, // Not yet delivered
      pickup: "07/10/2025",
      pickupActualDate: "07/10/2025", // On time
      tradeParty: "Pacific Air Cargo",
      grossWeight: 2100,
      volumeTeu: 1,
      containers: 0,
      costUsd: 31000,
    },
    {
      id: "PN#2025-010005",
      status: "Pending Customs",
      origin: "N/A",
      route: "Madrid → Lyon",
      transportMode: "Road" as TransportMode,
      departure: "09/10/2025",
      departureActualDate: null,
      arrival: "13/10/2025",
      arrivalActualDate: null,
      delivery: "14/10/2025",
      deliveryActualDate: null, // Not yet delivered
      pickup: "08/10/2025",
      pickupActualDate: "09/10/2025", // 1 day delay
      tradeParty: "EU Auto Parts",
      grossWeight: 5600,
      volumeTeu: 2,
      containers: 0,
      costUsd: 18000,
    },
  ] as Shipment[],
  completed: [
    {
      id: "CP#2025-000901",
      status: "Delivered",
      origin: "N/A",
      route: "Shanghai → Felixstowe",
      transportMode: "Sea" as TransportMode,
      departure: "01/08/2025",
      departureActualDate: "01/08/2025", // On time
      arrival: "05/09/2025",
      arrivalActualDate: "05/09/2025", // On time
      delivery: "06/09/2025",
      deliveryActualDate: "06/09/2025", // On time
      pickup: "31/07/2025",
      pickupActualDate: "31/07/2025", // On time
      tradeParty: "XYZ Shipper China",
      grossWeight: 12000,
      volumeTeu: 4,
      containers: 3,
      costUsd: 78000,
    },
    {
      id: "CP#2025-000902",
      status: "Delivered",
      origin: "N/A",
      route: "Felixstowe → Auckland",
      transportMode: "Sea" as TransportMode,
      departure: "05/08/2025",
      departureActualDate: "06/08/2025", // 1 day delay
      arrival: "12/09/2025",
      arrivalActualDate: "13/09/2025", // 1 day delay
      delivery: "14/09/2025",
      deliveryActualDate: "16/09/2025", // 2 days delay
      pickup: "04/08/2025",
      pickupActualDate: "04/08/2025", // On time
      tradeParty: "ABC Buyer New Zealand",
      grossWeight: 13400,
      volumeTeu: 4,
      containers: 3,
      costUsd: 87000,
    },
    {
      id: "CP#2025-000903",
      status: "Delivered",
      origin: "N/A",
      route: "Shanghai → Felixstowe",
      transportMode: "Sea" as TransportMode,
      departure: "08/08/2025",
      departureActualDate: "09/08/2025", // 1 day delay
      arrival: "15/09/2025",
      arrivalActualDate: "16/09/2025", // 1 day delay
      delivery: "16/09/2025",
      deliveryActualDate: "16/09/2025", // On time
      pickup: "07/08/2025",
      pickupActualDate: "08/08/2025", // 1 day delay
      tradeParty: "XYZ Shipper China",
      grossWeight: 9900,
      volumeTeu: 3,
      containers: 2,
      costUsd: 65000,
    },
    {
      id: "CP#2025-000904",
      status: "Delivered",
      origin: "N/A",
      route: "Felixstowe → Auckland",
      transportMode: "Sea" as TransportMode,
      departure: "12/08/2025",
      departureActualDate: "13/08/2025", // 1 day delay
      arrival: "20/09/2025",
      arrivalActualDate: "22/09/2025", // 2 days delay
      delivery: "22/09/2025",
      deliveryActualDate: "25/09/2025", // 3 days delay
      pickup: "11/08/2025",
      pickupActualDate: "11/08/2025", // On time
      tradeParty: "ABC Buyer New Zealand",
      grossWeight: 14350,
      volumeTeu: 5,
      containers: 4,
      costUsd: 99000,
    },
    {
      id: "CP#2025-000905",
      status: "Delivered",
      origin: "N/A",
      route: "Shanghai → Felixstowe",
      transportMode: "Sea" as TransportMode,
      departure: "15/08/2025",
      departureActualDate: "15/08/2025", // On time
      arrival: "23/09/2025",
      arrivalActualDate: "23/09/2025", // On time
      delivery: "24/09/2025",
      deliveryActualDate: "24/09/2025", // On time
      pickup: "14/08/2025",
      pickupActualDate: "14/08/2025", // On time
      tradeParty: "XYZ Shipper China",
      grossWeight: 11800,
      volumeTeu: 4,
      containers: 3,
      costUsd: 82000,
    },
    {
      id: "CP#2025-000906",
      status: "Delivered",
      origin: "N/A",
      route: "Felixstowe → Auckland",
      transportMode: "Sea" as TransportMode,
      departure: "18/08/2025",
      departureActualDate: "19/08/2025", // 1 day delay
      arrival: "26/09/2025",
      arrivalActualDate: "27/09/2025", // 1 day delay
      delivery: "28/09/2025",
      deliveryActualDate: "29/09/2025", // 1 day delay
      pickup: "17/08/2025",
      pickupActualDate: "19/08/2025", // 2 days delay
      tradeParty: "ABC Buyer New Zealand",
      grossWeight: 12600,
      volumeTeu: 4,
      containers: 3,
      costUsd: 87000,
    },
    {
      id: "CP#2025-000907",
      status: "Delivered",
      origin: "N/A",
      route: "Shanghai → Felixstowe",
      transportMode: "Sea" as TransportMode,
      departure: "21/08/2025",
      departureActualDate: "21/08/2025", // On time
      arrival: "29/09/2025",
      arrivalActualDate: "29/09/2025", // On time
      delivery: "30/09/2025",
      deliveryActualDate: "30/09/2025", // On time
      pickup: "20/08/2025",
      pickupActualDate: "20/08/2025", // On time
      tradeParty: "XYZ Shipper China",
      grossWeight: 10100,
      volumeTeu: 3,
      containers: 2,
      costUsd: 64000,
    },
    {
      id: "CP#2025-000908",
      status: "Delivered",
      origin: "N/A",
      route: "Felixstowe → Auckland",
      transportMode: "Sea" as TransportMode,
      departure: "24/08/2025",
      departureActualDate: "25/08/2025", // 1 day delay
      arrival: "02/10/2025",
      arrivalActualDate: "03/10/2025", // 1 day delay
      delivery: "04/10/2025",
      deliveryActualDate: "06/10/2025", // 2 days delay
      pickup: "23/08/2025",
      pickupActualDate: "24/08/2025", // 1 day delay
      tradeParty: "ABC Buyer New Zealand",
      grossWeight: 13900,
      volumeTeu: 5,
      containers: 4,
      costUsd: 101000,
    },
    {
      id: "CP#2025-000909",
      status: "Delivered",
      origin: "N/A",
      route: "Shanghai → Felixstowe",
      transportMode: "Sea" as TransportMode,
      departure: "27/08/2025",
      departureActualDate: "27/08/2025", // On time
      arrival: "05/10/2025",
      arrivalActualDate: "05/10/2025", // On time
      delivery: "06/10/2025",
      deliveryActualDate: "06/10/2025", // On time
      pickup: "26/08/2025",
      pickupActualDate: "26/08/2025", // On time
      tradeParty: "XYZ Shipper China",
      grossWeight: 11500,
      volumeTeu: 4,
      containers: 3,
      costUsd: 79000,
    },
    {
      id: "CP#2025-000910",
      status: "Delivered",
      origin: "N/A",
      route: "Felixstowe → Auckland",
      transportMode: "Sea" as TransportMode,
      departure: "30/08/2025",
      departureActualDate: "31/08/2025", // 1 day delay
      arrival: "08/10/2025",
      arrivalActualDate: "09/10/2025", // 1 day delay
      delivery: "10/10/2025",
      deliveryActualDate: "12/10/2025", // 2 days delay
      pickup: "29/08/2025",
      pickupActualDate: "29/08/2025", // On time
      tradeParty: "ABC Buyer New Zealand",
      grossWeight: 13200,
      volumeTeu: 4,
      containers: 3,
      costUsd: 88000,
    },
    {
      id: "CP#2025-000911",
      status: "Delivered",
      origin: "N/A",
      route: "Shanghai → Felixstowe",
      transportMode: "Sea" as TransportMode,
      departure: "02/09/2025",
      departureActualDate: "03/09/2025", // 1 day delay
      arrival: "10/10/2025",
      arrivalActualDate: "11/10/2025", // 1 day delay
      delivery: "12/10/2025",
      deliveryActualDate: "12/10/2025", // On time
      pickup: "01/09/2025",
      pickupActualDate: "02/09/2025", // 1 day delay
      tradeParty: "XYZ Shipper China",
      grossWeight: 12300,
      volumeTeu: 4,
      containers: 3,
      costUsd: 84000,
    },
    {
      id: "CP#2025-000912",
      status: "Delivered",
      origin: "N/A",
      route: "Felixstowe → Auckland",
      transportMode: "Sea" as TransportMode,
      departure: "05/09/2025",
      departureActualDate: "05/09/2025", // On time
      arrival: "14/10/2025",
      arrivalActualDate: "15/10/2025", // 1 day delay
      delivery: "16/10/2025",
      deliveryActualDate: "18/10/2025", // 2 days delay
      pickup: "04/09/2025",
      pickupActualDate: "04/09/2025", // On time
      tradeParty: "ABC Buyer New Zealand",
      grossWeight: 13600,
      volumeTeu: 4,
      containers: 3,
      costUsd: 91000,
    },
    {
      id: "CP#2025-000913",
      status: "Delivered",
      origin: "N/A",
      route: "Incheon → Seattle",
      transportMode: "Air" as TransportMode,
      departure: "15/08/2025",
      departureActualDate: "15/08/2025", // On time
      arrival: "16/08/2025",
      arrivalActualDate: "16/08/2025", // On time
      delivery: "17/08/2025",
      deliveryActualDate: "17/08/2025", // On time
      pickup: "14/08/2025",
      pickupActualDate: "14/08/2025", // On time
      tradeParty: "Everfast Electronics",
      grossWeight: 2800,
      volumeTeu: 1,
      containers: 0,
      costUsd: 36000,
    },
    {
      id: "CP#2025-000914",
      status: "Delivered",
      origin: "N/A",
      route: "Prague → Amsterdam",
      transportMode: "Road" as TransportMode,
      departure: "09/09/2025",
      departureActualDate: "10/09/2025", // 1 day delay
      arrival: "12/09/2025",
      arrivalActualDate: "13/09/2025", // 1 day delay
      delivery: "12/09/2025",
      deliveryActualDate: "13/09/2025", // 1 day delay
      pickup: "08/09/2025",
      pickupActualDate: "09/09/2025", // 1 day delay
      tradeParty: "Nordic Furniture",
      grossWeight: 6200,
      volumeTeu: 2,
      containers: 0,
      costUsd: 19000,
    },
  ] as Shipment[],
};

export const filterShipmentsByMode = (shipments: Shipment[], filter: TransportFilter) => {
  if (filter === "All") {
    return shipments;
  }

  return shipments.filter((shipment) => shipment.transportMode === filter);
};

