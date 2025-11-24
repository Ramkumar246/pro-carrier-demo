import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import * as turf from '@turf/turf';
import type { Feature, LineString } from 'geojson';
import 'mapbox-gl/dist/mapbox-gl.css';
import vesselIcon from '@/assets/vessel-finder/vessel-icon.png';
import vesselImage from '@/assets/vessel-finder/vessel_image.jpg';
import airIcon from '@/assets/vessel-finder/air.png';
import { toast } from '@/hooks/use-toast';
import portIcon from '@/assets/vessel-finder/port.png';
import addressIcon from '@/assets/vessel-finder/address.png';
import truckPickupIcon from '@/assets/vessel-finder/truck-pickup.png';
import truckDeliveryIcon from '@/assets/vessel-finder/truck-icon.png';
import voyageRaw from '@/data/vessel-finder/voyage.txt?raw';
import addressRaw from '@/data/vessel-finder/address.txt?raw';
import airRaw from '@/data/vessel-finder/air.txt?raw';
import type { Shipment } from '@/types/shipment';

const dedupeTrackPoints = <T extends { coordinate: [number, number] }>(points: T[]) =>
  points.reduce<T[]>((acc, point) => {
    const previous = acc[acc.length - 1];
    if (!previous || previous.coordinate[0] !== point.coordinate[0] || previous.coordinate[1] !== point.coordinate[1]) {
      acc.push(point);
    }
    return acc;
  }, []);

const dedupeSequentialCoordinates = (coordinates: [number, number][]) =>
  coordinates.reduce<[number, number][]>((acc, coordinate) => {
    const previous = acc[acc.length - 1];
    if (!previous || previous[0] !== coordinate[0] || previous[1] !== coordinate[1]) {
      acc.push(coordinate);
    }
    return acc;
  }, []);

type ShipPositionTag = 'historic' | 'latest' | 'predicted';

type HistoricTrackPoint = {
  coordinate: [number, number];
  datetime: string | null;
  tag: Exclude<ShipPositionTag, 'predicted'>;
};

type PredictedTrackPoint = {
  coordinate: [number, number];
  datetime: string | null;
};

interface TransportTrackPosition {
  longitude: number;
  latitude: number;
  position_datetime: string | null;
  tag: ShipPositionTag;
}

interface TransportTrackPortcall {
  un_location_code: string;
  port_name?: string;
  port_country?: string;
  port_timezone?: string;
  longitude?: number;
  latitude?: number;
  sta_datetime?: string | null;
  std_datetime?: string | null;
  eta_datetime?: string | null;
  etd_datetime?: string | null;
  ata_datetime?: string | null;
  atd_datetime?: string | null;
}

interface TransportTrack {
  start_datetime: string;
  end_datetime: string;
  pol_un_location_code: string;
  pod_un_location_code: string;
  state?: string;
  portcalls: TransportTrackPortcall[];
  positions: TransportTrackPosition[];
  vessel: {
    vessel_name: string;
    vessel_imo_number: number;
    vessel_mmsi_number?: number;
    vessel_length?: number;
    vessel_width?: number;
    vessel_callsign?: string;
    vessel_type?: string;
    vessel_country_code?: string;
    vessel_draught?: number | null;
    vessel_sog?: number | null;
    vessel_cog?: number | null;
    vessel_heading?: number | null;
    vessel_rot?: number | null;
    vessel_nav_status?: string | null;
    vessel_source_datetime?: string;
  };
}

interface VoyageFile {
  id: number;
  transport_tracks: TransportTrack[];
}

interface AirFlightResponse {
  data?: {
    flight_status?: string;
    departure?: {
      airport?: string;
      timezone?: string;
      iata?: string;
      icao?: string;
      terminal?: string;
      gate?: string | null;
      delay?: number | null;
      scheduled?: string;
      estimated?: string | null;
      actual?: string | null;
      estimated_runway?: string | null;
      actual_runway?: string | null;
    };
    arrival?: {
      airport?: string;
      timezone?: string;
      iata?: string;
      icao?: string;
      terminal?: string;
      gate?: string | null;
      baggage?: string | null;
      delay?: number | null;
      scheduled?: string;
      estimated?: string | null;
      actual?: string | null;
    };
    airline?: {
      name?: string;
      iata?: string;
      icao?: string;
    };
    flight?: {
      number?: string;
      iata?: string;
      icao?: string;
    };
    aircraft?: {
      registration?: string;
      iata?: string;
      icao?: string;
      icao24?: string;
    };
    live?: {
      latitude?: number;
      longitude?: number;
    };
  }[];
}

const voyageData = JSON.parse(voyageRaw) as VoyageFile;

const airFlightData: AirFlightResponse = airRaw ? JSON.parse(airRaw) : {};
const activeAirFlight = airFlightData.data?.[0];

const normalizeVesselName = (name: string) =>
  name === 'MORTEN MAERSK' ? 'MAERSK' : name;

const primaryTrack = voyageData.transport_tracks[0];
const rawPositions: TransportTrackPosition[] = primaryTrack?.positions ?? [];

const sortByDatetime = (positions: TransportTrackPosition[]) =>
  positions
    .slice()
    .sort((a, b) => {
      const aTime = a.position_datetime ? new Date(a.position_datetime).getTime() : 0;
      const bTime = b.position_datetime ? new Date(b.position_datetime).getTime() : 0;
      return aTime - bTime;
    });

const actualPositions: HistoricTrackPoint[] = sortByDatetime(
  rawPositions.filter((entry) => ['historic', 'latest'].includes(entry.tag))
).map((entry) => ({
  coordinate: [entry.longitude, entry.latitude] as [number, number],
  datetime: entry.position_datetime,
  tag: (entry.tag as Exclude<ShipPositionTag, 'predicted'>) ?? 'historic',
}));

const predictedPositions: PredictedTrackPoint[] = sortByDatetime(
  rawPositions.filter((entry) => entry.tag === 'predicted')
).map((entry) => ({
  coordinate: [entry.longitude, entry.latitude] as [number, number],
  datetime: entry.position_datetime,
}));

const historicTrackPoints = dedupeTrackPoints(actualPositions);
const predictedTrackPoints = dedupeTrackPoints(predictedPositions);

const currentPosition =
  historicTrackPoints[historicTrackPoints.length - 1]?.coordinate ??
  predictedTrackPoints[0]?.coordinate ??
  [0, 0];

const historicCoordinates = dedupeSequentialCoordinates(
  historicTrackPoints.map((position) => position.coordinate)
);
const predictedCoordinates = dedupeSequentialCoordinates(
  predictedTrackPoints.map((position) => position.coordinate)
);
const combinedCoordinates = dedupeSequentialCoordinates([
  ...historicCoordinates,
  ...predictedCoordinates,
]);

// Build a combined time series of vessel positions for use by the clock/slider UI
type TimeSeriesPoint = {
  time: Date;
  coord: [number, number];
};

const trackTimeSeries: TimeSeriesPoint[] = sortByDatetime(
  rawPositions.filter((entry) => !!entry.position_datetime)
).map((entry) => ({
  time: new Date(entry.position_datetime as string),
  coord: [entry.longitude, entry.latitude] as [number, number],
}));

const initialSimulationIndex: number = (() => {
  if (!trackTimeSeries.length) return 0;

  const lastHistoric = actualPositions[actualPositions.length - 1];
  if (lastHistoric?.datetime) {
    const targetTime = new Date(lastHistoric.datetime).getTime();
    const matchIndex = trackTimeSeries.findIndex(
      (p) => p.time.getTime() === targetTime
    );
    if (matchIndex >= 0) return matchIndex;
  }

  // Fallback to the last known point in the time series
  return trackTimeSeries.length - 1;
})();

const calculateTrackDistance = (coordinates: [number, number][]) =>
  coordinates.length < 2
    ? 0
    : turf.length(turf.lineString(coordinates), { units: 'kilometers' });

const historicDistance = calculateTrackDistance(historicCoordinates);
const totalDistance = calculateTrackDistance(combinedCoordinates);

const portCoordinates: Record<string, [number, number]> = {
  CNQDG: [120.3200, 36.0649],
  CNYTN: [121.6000, 31.2000],
  GBLGP: [0.5810, 51.4816],
};

const PICKUP_ADDRESS_COORDINATE: [number, number] = [114.11220215937088, 22.842008393773565];
const DELIVERY_ADDRESS_COORDINATE: [number, number] = [-4.193068176840833, 55.927538256433515];

const getPortCoordinate = (
  code: string,
  fallback: [number, number]
): [number, number] => portCoordinates[code] ?? fallback;

const pickupCoordinate = historicCoordinates[0] ?? currentPosition;
const originPortCode = primaryTrack?.pol_un_location_code ?? 'CNQDG';
const destinationPortCode = primaryTrack?.pod_un_location_code ?? 'GBLGP';

const originCoordinate = getPortCoordinate(originPortCode, pickupCoordinate);
const destinationCoordinate = getPortCoordinate(
  destinationPortCode,
  predictedPositions[predictedPositions.length - 1]?.coordinate ?? currentPosition
);
const deliveryCoordinate =
  predictedPositions[predictedPositions.length - 1]?.coordinate ??
  destinationCoordinate;

const vesselProgressValue = totalDistance
  ? (historicDistance / totalDistance) * 100
  : 0;

interface Container {
  id: string;
  number: string;
  type: string;
  weight: string;
}

interface AirCargo {
  id: string;
  label: string;
  pieces: string;
  weight: string;
  volume?: string;
  description?: string;
  status?: string;
}

const DEFAULT_MAPBOX_TOKEN =
  (import.meta as any)?.env?.VITE_MAPBOX_ACCESS_TOKEN ||
  'pk.eyJ1IjoiYXNoYTA0IiwiYSI6ImNtaHhiM3RtNjAwZm4ya3F6ZGRraHg2dm8ifQ.J9VI1lZY3LL8Nx6IXwLoVw';

const vesselContainers: Container[] = [
  {
    id: 'container-abn-1',
    number: 'ABCD9876543',
    type: '40ft HC',
    weight: '24,000 kg',
  },
  {
    id: 'container-abn-2',
    number: 'ABN987654321',
    type: '20ft STD',
    weight: '18,500 kg',
  },
  {
    id: 'container-abn-3',
    number: 'ABN567890123',
    type: '40ft HC',
    weight: '26,300 kg',
  },
];

const airCargos: AirCargo[] = [
  {
    id: 'cargo-001',
    label: 'Cargo 001',
    pieces: '1 pallet',
    weight: '3,000 kg',
    volume: '8.0 CBM',
    description: 'Children book assortment',
    status: 'Loaded',
  },
  {
    id: 'cargo-002',
    label: 'Cargo 002',
    pieces: '2 pallets',
    weight: '5,500 kg',
    volume: '12.3 CBM',
    description: 'Gift sets and promotional items',
    status: 'Planned',
  },
];

const seaCorridorWaypoints: [number, number][] = [
  [122, 33],
  [116, 22],
  [106, 13],
  [97, 6],
  [82, 8],
  [68, 16],
  [55, 23],
  [40, 30],
  [25, 35],
  [10, 40],
  [0, 48],
];

const generateSeaRoute = (
  start: [number, number],
  end: [number, number]
): [number, number][] => {
  const [startLng, endLng] = [start[0], end[0]];
  const descending = startLng >= endLng;

  const filtered = seaCorridorWaypoints
    .filter(([lng]) =>
      descending ? lng <= startLng + 3 && lng >= endLng - 3 : lng >= startLng - 3 && lng <= endLng + 3
    )
    .sort((a, b) => (descending ? b[0] - a[0] : a[0] - b[0]));

  return dedupeSequentialCoordinates([start, ...filtered, end]);
};

const buildPredictedRoute = (
  start: [number, number],
  destination: [number, number],
  predictedTrack: [number, number][]
): [number, number][] => {
  const corridor = generateSeaRoute(start, destination);
  if (corridor.length < 2) {
    return dedupeSequentialCoordinates([start, destination]);
  }

  const corridorLine = turf.lineString(corridor);
  let accumulatedDistance = 0;
  const corridorPointsWithLocation = corridor.map((coord, index) => {
    if (index === 0) {
      return { coord, location: 0 };
    }

    const segmentDistance = turf.distance(corridor[index - 1], coord, { units: 'kilometers' });
    accumulatedDistance += segmentDistance;
    return { coord, location: accumulatedDistance };
  });

  const projectedPredictedPoints = predictedTrack.map((coord) => {
    const nearest = turf.nearestPointOnLine(corridorLine, turf.point(coord), { units: 'kilometers' });
    const location = typeof nearest.properties?.location === 'number' ? nearest.properties.location : 0;
    return {
      coord: nearest.geometry.coordinates as [number, number],
      location,
    };
  });

  const combined = [...corridorPointsWithLocation, ...projectedPredictedPoints].sort(
    (a, b) => a.location - b.location
  );

  const deduped: [number, number][] = [];
  combined.forEach(({ coord }) => {
    const last = deduped[deduped.length - 1];
    if (!last || Math.abs(last[0] - coord[0]) > 1e-4 || Math.abs(last[1] - coord[1]) > 1e-4) {
      deduped.push(coord);
    }
  });

  return deduped.length ? deduped : dedupeSequentialCoordinates([start, destination]);
};

const buildAddressFallbackRoute = (start: [number, number], end: [number, number]) => {
  const corridor = generateSeaRoute(start, end);
  const coordinates = corridor.length >= 2 ? corridor : [start, end];
  return turf.lineString(coordinates);
};

interface ParsedAddress {
  title: string;
  data: Record<string, string>;
}

interface AddressLocation extends ParsedAddress {
  coordinate?: [number, number];
}

type AddressNavType = 'pickup' | 'delivery';

const getRouteDescription = (type: AddressNavType) =>
  type === 'pickup' ? 'Origin → Pickup' : 'Destination → Delivery';

const cleanValue = (value: string) => value.replace(/^"|"$/g, '').replace(/,$/, '');

const parseAddressSection = (label: string, block: string): ParsedAddress | undefined => {
  if (!block) return undefined;
  const lines = block
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.includes(':'));

  const data: Record<string, string> = {};
  lines.forEach((line) => {
    const [key, rawValue] = line.split(':');
    if (key && rawValue !== undefined) {
      const value = cleanValue(rawValue.trim());
      if (value && value !== 'null') {
        data[key.trim()] = value;
      }
    }
  });

  if (!Object.keys(data).length) return undefined;
  return {
    title: label,
    data,
  };
};

const parseAddressFile = (raw: string) => {
  const [deliverySectionRaw = '', pickupSectionRaw = ''] = raw.split(/Pickup Address/i);
  const [deliveryBlock] = deliverySectionRaw.split(/Pickup Address/i);
  const pickupBlock = pickupSectionRaw;

  return {
    delivery: parseAddressSection('Delivery Address', deliveryBlock ?? ''),
    pickup: parseAddressSection('Pickup Address', pickupBlock ?? ''),
  };
};

const formatAddressForGeocoding = (address?: ParsedAddress) => {
  if (!address) return '';
  const fields = address.data;
  return [
    fields.AddressLine1,
    fields.AddressLine2,
    fields.AddressCity,
    fields.AddressState,
    fields.AddressPostCode,
    fields.AddressCountryName,
  ]
    .filter(Boolean)
    .join(', ');
};

interface VesselData {
  id: string;
  name: string;
  position: [number, number];
  containers: Container[];
  progress?: number; // Progress percentage (0-100)
  route: {
    pickup: [number, number];
    origin: [number, number];
    destination: [number, number];
    delivery: [number, number];
  };
  track: {
    historic: HistoricTrackPoint[];
    predicted: PredictedTrackPoint[];
  };
}

interface VoyageSummary {
  status: string;
  location: string;
  vesselName: string;
  etaDate: string;
  etaTime: string;
  lastPort: string;
  nextPort: string;
  cargo: string;
  timelinessStatus: 'on-time' | 'delayed' | 'unknown';
  timelinessLabel: string;
  voyageMilestones: {
    id: string;
    label: string;
    location: string;
    statusLabel: string;
    status: 'completed' | 'scheduled' | 'delayed' | 'pending';
    date: string;
  }[];
  transitDays: number;
  transitDaysRemaining: number;
}

interface SegmentData {
  distance: string;
  emissions: string;
  cost: number;
  travelTime: number;
}

interface VesselMapProps {
  onVesselClick?: (vessel: VesselData) => void;
  onContainerClick?: (container: Container, vessel: VesselData) => void;
  onAddressViewChange?: (mode: 'default' | 'supplier' | 'buyer') => void;
  onSegmentDataChange?: (data: SegmentData | null) => void;
  onVoyageSummaryChange?: (summary: VoyageSummary) => void;
  activeShipment?: Shipment | null;
}

const parsedAddresses = parseAddressFile(addressRaw ?? '');

const parseShipmentDate = (value: string | null | undefined): Date | null => {
  if (!value) return null;
  const parts = value.split('/');
  if (parts.length !== 3) {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const [day, month, year] = parts.map((p) => Number(p));
  if (!day || !month || !year) return null;
  const d = new Date(year, month - 1, day);
  return Number.isNaN(d.getTime()) ? null : d;
};

const computeDateBasedProgress = (
  departure: string | null | undefined,
  arrival: string | null | undefined,
): number => {
  const start = parseShipmentDate(departure ?? null);
  const end = parseShipmentDate(arrival ?? null);
  if (!start || !end || start >= end) return 50; // fallback mid-route

  const now = new Date();
  const totalMs = end.getTime() - start.getTime();
  const elapsedMs = now.getTime() - start.getTime();
  if (elapsedMs <= 0) return 0;
  if (elapsedMs >= totalMs) return 100;
  return Math.max(0, Math.min(100, (elapsedMs / totalMs) * 100));
};

const VesselMap: React.FC<VesselMapProps> = ({
  onVesselClick,
  onContainerClick,
  onAddressViewChange,
  onSegmentDataChange,
  onVoyageSummaryChange,
  activeShipment,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [selectedVessel, setSelectedVessel] = useState<VesselData | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>(DEFAULT_MAPBOX_TOKEN);
  const [tokenInput, setTokenInput] = useState<string>(DEFAULT_MAPBOX_TOKEN);
  const [isTokenSet, setIsTokenSet] = useState<boolean>(true);
  const [expandedVessel, setExpandedVessel] = useState<string | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isMapReady, setIsMapReady] = useState<boolean>(false);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const vesselMarkersRef = useRef<Record<string, mapboxgl.Marker>>({});
  const routeMarkersRef = useRef<{ [key: string]: mapboxgl.Marker[] }>({});
  const truckMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const routeCacheRef = useRef<Map<string, Feature<LineString>>>(new Map());
  const activeNavigationRouteRef = useRef<{ feature: Feature<LineString>; type: AddressNavType } | null>(null);
  const dashAnimationRef = useRef<number | null>(null);
  const hasInitializedSelectedVesselRef = useRef(false);
  const [vesselProgress, setVesselProgress] = useState<Record<string, number>>({});
  const [animatingVessel, setAnimatingVessel] = useState<string | null>(null);
  const [navigationMode, setNavigationMode] = useState<'pickup' | 'delivery' | null>(null);
  const [truckProgress, setTruckProgress] = useState<number>(0);
  const [isLoadingRoute, setIsLoadingRoute] = useState<boolean>(false);
  const [containerDeliveryDates, setContainerDeliveryDates] = useState<Record<string, string>>({});
  const [routeError, setRouteError] = useState<string | null>(null);
  const [demurrageAlertStep, setDemurrageAlertStep] = useState<number>(0);
  const [demurrageContainerId, setDemurrageContainerId] = useState<string | null>(null);
  const [showDemurrageBanner, setShowDemurrageBanner] = useState<boolean>(false);
  const [animationSpeed, setAnimationSpeed] = useState<number>(1);
  const [currentZoom, setCurrentZoom] = useState<number>(4);
  const [is3DView, setIs3DView] = useState<boolean>(false);
  const [lightingPreset, setLightingPreset] = useState<'dawn' | 'day' | 'dusk' | 'night'>('day');
  const [addressLocations, setAddressLocations] = useState<{
    pickup?: AddressLocation;
    delivery?: AddressLocation;
  }>(() => ({
    pickup: parsedAddresses.pickup
      ? { ...parsedAddresses.pickup, coordinate: PICKUP_ADDRESS_COORDINATE }
      : undefined,
    delivery: parsedAddresses.delivery
      ? { ...parsedAddresses.delivery, coordinate: DELIVERY_ADDRESS_COORDINATE }
      : undefined,
  }));
  const [addressRoutes, setAddressRoutes] = useState<{
    pickupToOrigin?: Feature<LineString>;
    destinationToDelivery?: Feature<LineString>;
  }>({});
  const [activeNavigation, setActiveNavigation] = useState<Record<AddressNavType, boolean>>({
    pickup: true,
    delivery: true,
  });
  const [simulationIndex, setSimulationIndex] = useState<number>(initialSimulationIndex);
  const simulationTime = trackTimeSeries[simulationIndex]?.time ?? null;
  const planeMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const airRouteRef = useRef<Feature<LineString> | null>(null);
  const hasShownAirToastRef = useRef<boolean>(false);
  const [selectedAirCargoId, setSelectedAirCargoId] = useState<string | null>(
    airCargos[0]?.id ?? null,
  );

  const isAirMode = activeShipment?.transportMode === 'Air';
  const isRoadMode = activeShipment?.transportMode === 'Road';

  const airFlight = activeAirFlight;
  const airDeparture = airFlight?.departure;
  const airArrival = airFlight?.arrival;
  const airAirline = airFlight?.airline;
  const airFlightInfo = airFlight?.flight;
  const airDepartureLabel =
    airDeparture?.iata
      ? `${airDeparture.airport ?? ''} (${airDeparture.iata})`
      : airDeparture?.airport;
  const airArrivalLabel =
    airArrival?.iata
      ? `${airArrival.airport ?? ''} (${airArrival.iata})`
      : airArrival?.airport;

  const formatFlightTime = (iso?: string | null) => {
    if (!iso) return '-';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '-';
    const day = d.getUTCDate().toString().padStart(2, '0');
    const month = (d.getUTCMonth() + 1).toString().padStart(2, '0');
    const hours = d.getUTCHours().toString().padStart(2, '0');
    const mins = d.getUTCMinutes().toString().padStart(2, '0');
    return `${day}/${month} ${hours}:${mins} UTC`;
  };

  const geocodeAddress = useCallback(
    async (address: ParsedAddress): Promise<[number, number] | undefined> => {
      if (!mapboxToken) return undefined;
      const formatted = formatAddressForGeocoding(address);
      if (!formatted) return undefined;
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        formatted
      )}.json?limit=1&access_token=${mapboxToken}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to geocode address: ${response.status}`);
      }
      const data = await response.json();
      const [lng, lat] = data.features?.[0]?.center ?? [];
      if (typeof lng === 'number' && typeof lat === 'number') {
        return [lng, lat];
      }
      return undefined;
    },
    [mapboxToken]
  );

  const geocodePlace = useCallback(
    async (place: string): Promise<[number, number] | undefined> => {
      if (!mapboxToken) return undefined;
      const trimmed = place.trim();
      if (!trimmed) return undefined;
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        trimmed,
      )}.json?limit=1&access_token=${mapboxToken}`;
      const response = await fetch(url);
      if (!response.ok) return undefined;
      const data = await response.json();
      const [lng, lat] = data.features?.[0]?.center ?? [];
      if (typeof lng === 'number' && typeof lat === 'number') {
        return [lng, lat];
      }
      return undefined;
    },
    [mapboxToken],
  );

  const reverseGeocodeCountryName = useCallback(
    async (coord: [number, number]): Promise<string | undefined> => {
      if (!mapboxToken) return undefined;
      const [lng, lat] = coord;
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?types=country&limit=1&access_token=${mapboxToken}`;
      const response = await fetch(url);
      if (!response.ok) return undefined;
      const data = await response.json();
      const feature = data.features?.[0];
      if (!feature) return undefined;

      const directCode =
        (feature.properties?.short_code as string | undefined) ||
        ((feature as any).short_code as string | undefined) ||
        undefined;

      const contextCountry = (feature.context || []).find(
        (c: any) => typeof c.id === 'string' && c.id.startsWith('country.'),
      );
      const contextCode =
        (contextCountry?.short_code as string | undefined) ||
        (contextCountry?.properties?.short_code as string | undefined) ||
        undefined;

      const code = (directCode || contextCode || '').toUpperCase();
      return code || undefined;
    },
    [mapboxToken],
  );

  const fetchDirections = useCallback(
    async (
      start: [number, number],
      end: [number, number]
    ): Promise<Feature<LineString> | undefined> => {
      if (!mapboxToken) return undefined;
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?overview=full&geometries=geojson&access_token=${mapboxToken}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch directions: ${response.status}`);
      }
      const data = await response.json();
      const geometry = data.routes?.[0]?.geometry as LineString | undefined;
      if (geometry?.coordinates?.length) {
        return {
          type: 'Feature',
          geometry,
          properties: {},
        };
      }
      return undefined;
    },
    [mapboxToken]
  );

  const createMarkerElement = (icon: string, size: { width: number; height: number }) => {
    const el = document.createElement('div');
    el.style.width = `${size.width}px`;
    el.style.height = `${size.height}px`;
    el.style.backgroundImage = `url(${icon})`;
    el.style.backgroundSize = 'contain';
    el.style.backgroundRepeat = 'no-repeat';
    el.style.backgroundPosition = 'center';
    el.style.pointerEvents = 'auto';
    el.style.cursor = 'pointer';
    return el;
  };

  const vessels: VesselData[] = useMemo(
    () => [
      {
        id: String(primaryTrack?.vessel.vessel_imo_number ?? voyageData.id),
        name: normalizeVesselName(primaryTrack?.vessel.vessel_name ?? 'Vessel'),
        position: currentPosition,
        progress: Math.min(100, Math.max(0, vesselProgressValue)),
        containers: vesselContainers,
        route: {
          pickup: pickupCoordinate,
          origin: originCoordinate,
          destination: destinationCoordinate,
          delivery: deliveryCoordinate,
        },
        track: {
          historic: historicTrackPoints,
          predicted: predictedTrackPoints,
        },
      },
    ],
    []
  );

  // Default the selected vessel to the primary voyage vessel once so the sidebar is initially populated
  useEffect(() => {
    if (isAirMode) {
      setSelectedVessel(null);
      return;
    }
    if (!hasInitializedSelectedVesselRef.current && !selectedVessel && vessels[0]) {
      setSelectedVessel(vessels[0]);
      hasInitializedSelectedVesselRef.current = true;
    }
  }, [selectedVessel, vessels, isAirMode]);

  useEffect(() => {
    if (!onVoyageSummaryChange || !primaryTrack || isAirMode) return;

    const portcalls = primaryTrack.portcalls ?? [];
    const lastVisited = [...portcalls]
      .reverse()
      .find((pc) => pc.atd_datetime || pc.ata_datetime);
    const finalPort = portcalls[portcalls.length - 1];
    const etaPort = portcalls.find((pc) => pc.eta_datetime) ?? finalPort ?? lastVisited;

    const formatDate = (iso?: string | null) => {
      if (!iso) return '-';
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return '-';
      const day = d.getUTCDate().toString().padStart(2, '0');
      const month = (d.getUTCMonth() + 1).toString().padStart(2, '0');
      const year = d.getUTCFullYear();
      return `${day}/${month}/${year}`;
    };

    const formatTime = (iso?: string | null) => {
      if (!iso) return '-';
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return '-';
      const hours = d.getUTCHours().toString().padStart(2, '0');
      const mins = d.getUTCMinutes().toString().padStart(2, '0');
      return `${hours}:${mins}`;
    };

    const etaIso = etaPort?.eta_datetime ?? primaryTrack.end_datetime ?? null;

    // Determine on-time vs delayed relative to scheduled arrival at final port
    const schedIso = finalPort?.sta_datetime ?? null;
    let timelinessStatus: 'on-time' | 'delayed' | 'unknown' = 'unknown';
    let timelinessLabel = 'Schedule not available';

    if (schedIso) {
      const sched = new Date(schedIso);
      const actualIso = finalPort?.ata_datetime ?? finalPort?.eta_datetime ?? etaIso;
      if (actualIso) {
        const actual = new Date(actualIso);
        if (!Number.isNaN(sched.getTime()) && !Number.isNaN(actual.getTime())) {
          const diffMs = actual.getTime() - sched.getTime();
          const diffHours = diffMs / 3.6e6;
          const absHours = Math.abs(diffHours);

          // Treat arrival within 2 hours of schedule (or earlier) as on time
          if (diffHours <= 0 || absHours <= 2) {
            timelinessStatus = 'on-time';
            timelinessLabel = 'On time';
          } else {
            timelinessStatus = 'delayed';
            const totalHours = Math.round(diffHours);
            const days = Math.floor(totalHours / 24);
            const hours = totalHours % 24;
            if (days > 0) {
              timelinessLabel = `Delayed ${days}d${hours ? ` ${hours}h` : ''}`;
            } else {
              timelinessLabel = `Delayed ${hours}h`;
            }
          }
        }
      }
    }

    const voyageMilestones = portcalls.map((pc, index) => {
      const isFirst = index === 0;
      const isLast = index === portcalls.length - 1;
      const label = isFirst ? 'Departure' : isLast ? 'Final Arrival' : 'Transshipment';

      const hasActual = !!(pc.atd_datetime || pc.ata_datetime);
      let status: 'completed' | 'scheduled' | 'delayed' | 'pending' = 'scheduled';
      let statusLabel = 'Scheduled';

      if (hasActual) {
        status = 'completed';
        statusLabel = 'Completed';
      } else if (isLast && timelinessStatus === 'delayed') {
        status = 'delayed';
        statusLabel = 'Delayed';
      } else if (isLast) {
        status = 'scheduled';
        statusLabel = timelinessStatus === 'on-time' ? 'On Schedule' : 'Scheduled';
      }

      const dateIso = pc.atd_datetime || pc.ata_datetime || pc.eta_datetime || pc.sta_datetime;

      return {
        id: `${pc.un_location_code}-${index}`,
        label,
        location: pc.port_name ?? pc.un_location_code,
        statusLabel,
        status,
        date: formatDate(dateIso),
      };
    });

    // Compute total transit time in days from first port departure to final arrival/ETA
    const firstPort = portcalls[0];
    const departureIso = firstPort?.atd_datetime ?? firstPort?.ata_datetime ?? primaryTrack.start_datetime ?? null;
    let transitDays = 0;
    let transitDaysRemaining = 0;
    if (departureIso && etaIso) {
      const dep = new Date(departureIso);
      const arr = new Date(etaIso);
      if (!Number.isNaN(dep.getTime()) && !Number.isNaN(arr.getTime())) {
        const diffMs = arr.getTime() - dep.getTime();
        const diffDays = diffMs / 8.64e7; // ms in a day
        transitDays = Math.max(0, Math.round(diffDays));

        // Remaining days: from last known historic position to arrival
        const lastKnownIso =
          actualPositions[actualPositions.length - 1]?.datetime ??
          trackTimeSeries[trackTimeSeries.length - 1]?.time.toISOString() ??
          departureIso;

        if (lastKnownIso) {
          const last = new Date(lastKnownIso);
          if (!Number.isNaN(last.getTime())) {
            const remMs = arr.getTime() - last.getTime();
            const remDays = remMs / 8.64e7;
            transitDaysRemaining = Math.max(0, Math.round(remDays));
          }
        }
      }
    }

    const summary: VoyageSummary = {
      status: primaryTrack.state === 'ONGOING' ? 'Shipment in Transit' : primaryTrack.state || 'Voyage Status',
      location: etaPort?.port_name ?? etaPort?.un_location_code ?? 'At sea',
      vesselName: normalizeVesselName(primaryTrack?.vessel.vessel_name ?? 'Vessel'),
      etaDate: formatDate(etaIso),
      etaTime: formatTime(etaIso),
      lastPort: lastVisited
        ? `Departed ${lastVisited.port_name ?? lastVisited.un_location_code} • ${formatDate(lastVisited.atd_datetime ?? lastVisited.ata_datetime)}`
        : 'Last port unknown',
      nextPort: etaPort && etaPort !== lastVisited
        ? `Arriving ${etaPort.port_name ?? etaPort.un_location_code} • ${formatDate(etaIso)}`
        : 'Final port ETA pending',
      cargo: `${vesselContainers.length} containers • IMO ${primaryTrack.vessel.vessel_imo_number}`,
      timelinessStatus,
      timelinessLabel,
      voyageMilestones,
      transitDays,
      transitDaysRemaining,
    };

    onVoyageSummaryChange(summary);
  }, [onVoyageSummaryChange, primaryTrack, vesselContainers.length, isAirMode]);

  // Initialize progress state from vessels data
  useEffect(() => {
    if (!mapboxToken) return;

    let cancelled = false;

    const enrichAddresses = async () => {
      try {
        const locationUpdates: typeof addressLocations = {};
        const routeUpdates: typeof addressRoutes = {};

        if (parsedAddresses.pickup && originCoordinate) {
          let pickupCoord = addressLocations.pickup?.coordinate;
          if (!pickupCoord) {
            const resolved = await geocodeAddress(parsedAddresses.pickup);
            if (cancelled) return;
            if (resolved) {
              locationUpdates.pickup = { ...parsedAddresses.pickup, coordinate: resolved };
              pickupCoord = resolved;
            }
          }

          if (pickupCoord && !addressRoutes.pickupToOrigin) {
            try {
              const route = await fetchDirections(pickupCoord, originCoordinate);
              if (!cancelled && route) {
                routeUpdates.pickupToOrigin = route;
              }
            } catch (error) {
              console.error('Failed to fetch pickup directions', error);
            }
          }
        }

        if (parsedAddresses.delivery && destinationCoordinate) {
          let deliveryCoord = addressLocations.delivery?.coordinate;
          if (!deliveryCoord) {
            const resolved = await geocodeAddress(parsedAddresses.delivery);
            if (cancelled) return;
            if (resolved) {
              locationUpdates.delivery = { ...parsedAddresses.delivery, coordinate: resolved };
              deliveryCoord = resolved;
            }
          }

          if (deliveryCoord && !addressRoutes.destinationToDelivery) {
            try {
              const route = await fetchDirections(destinationCoordinate, deliveryCoord);
              if (!cancelled && route) {
                routeUpdates.destinationToDelivery = route;
              }
            } catch (error) {
              console.error('Failed to fetch delivery directions', error);
            }
          }
        }

        if (!cancelled && Object.keys(locationUpdates).length) {
          setAddressLocations((prev) => ({
            pickup: locationUpdates.pickup ?? prev.pickup,
            delivery: locationUpdates.delivery ?? prev.delivery,
          }));
        }

        if (!cancelled && Object.keys(routeUpdates).length) {
          setAddressRoutes((prev) => ({
            ...prev,
            ...routeUpdates,
          }));
        }
      } catch (error) {
        console.error('Failed to enrich address data', error);
      }
    };

    enrichAddresses();

    return () => {
      cancelled = true;
    };
  }, [
    mapboxToken,
    originCoordinate,
    destinationCoordinate,
    geocodeAddress,
    fetchDirections,
    addressLocations.pickup?.coordinate,
    addressLocations.delivery?.coordinate,
    addressRoutes.pickupToOrigin,
    addressRoutes.destinationToDelivery,
  ]);

  const calculateSegmentData = useCallback((segmentType: 'pickup-origin' | 'destination-delivery') => {
    const isPickup = segmentType === 'pickup-origin';
    const route = isPickup ? addressRoutes.pickupToOrigin : addressRoutes.destinationToDelivery;
    const startCoord = isPickup ? addressLocations.pickup?.coordinate : destinationCoordinate;
    const endCoord = isPickup ? originCoordinate : addressLocations.delivery?.coordinate;

    if (!route || !startCoord || !endCoord) return null;

    const distance = turf.length(route, { units: 'kilometers' });
    const emissions = distance * 0.262; // kg CO2 per km for road transport (avg truck)
    const drayageCost = distance * 5.5; // Estimated $5.5 per km
    const travelTime = Math.round((distance / 45) * 60); // Assuming 45 km/h avg speed

    return {
      distance: distance.toFixed(1),
      emissions: emissions.toFixed(1),
      cost: Math.round(drayageCost),
      travelTime,
      route,
      startCoord,
      endCoord,
    };
  }, [addressRoutes, addressLocations, originCoordinate, destinationCoordinate]);

  // Get responsive marker sizes based on zoom level
  const getMarkerSizes = useCallback((zoom: number) => {
    if (zoom > 10) {
      return {
        port: { width: 35, height: 37 },
        address: { width: 52, height: 42 },
        truck: { width: 74, height: 74 }
      };
    } else if (zoom > 6) {
      return {
        port: { width: 25, height: 27 },
        address: { width: 42, height: 32 },
        truck: { width: 64, height: 64 }
      };
    } else {
      return {
        port: { width: 20, height: 22 },
        address: { width: 32, height: 24 },
        truck: { width: 54, height: 54 }
      };
    }
  }, []);

  const createTruckMarker = useCallback((rotation: number = 0, isPickup: boolean = true) => {
    const sizes = getMarkerSizes(currentZoom);
    const el = document.createElement('div');
    el.style.width = `${sizes.truck.width}px`;
    el.style.height = `${sizes.truck.height}px`;
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    el.style.filter = is3DView 
      ? 'drop-shadow(0 6px 12px rgba(0,0,0,0.5)) drop-shadow(0 2px 4px rgba(0,0,0,0.3))' 
      : 'drop-shadow(0 3px 6px rgba(0,0,0,0.4))';
    el.style.backgroundColor = 'transparent';
    el.style.transition = 'filter 0.3s ease';
    
    const img = document.createElement('img');
    // Use truck-pickup.png for pickup routes, truck-icon.png for delivery routes
    img.src = isPickup ? truckPickupIcon : truckDeliveryIcon;
    img.style.width = '50%';
    img.style.height = '60%';
    img.style.objectFit = 'contain';
    img.style.backgroundColor = 'transparent';
    img.style.transform = `rotate(${rotation}deg)`;
    // Hide truck icon for navigation view while keeping marker logic intact
    img.style.opacity = '0';
    img.style.mixBlendMode = 'multiply';
    el.appendChild(img);
    
    return el;
  }, [currentZoom, getMarkerSizes, is3DView]);

  const animateTruckAlongRoute = useCallback((route: Feature<LineString>, rotation: number = 0, isPickup: boolean = true) => {
    if (!map.current) return;

    // Remove existing truck marker
    if (truckMarkerRef.current) {
      truckMarkerRef.current.remove();
      truckMarkerRef.current = null;
    }

    const routeLine = route.geometry.coordinates;
    const totalDistance = turf.length(route, { units: 'kilometers' });
    
    const truckEl = createTruckMarker(rotation, isPickup);
    const truckMarker = new mapboxgl.Marker({ element: truckEl, anchor: 'center' })
      .setLngLat(routeLine[0] as [number, number])
      .addTo(map.current);
    
    truckMarkerRef.current = truckMarker;

    let currentProgress = 0;
    const animationDuration = 15000; // 15 seconds for full route (slower movement)
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      currentProgress = Math.min((elapsed / animationDuration) * 100, 100);
      
      const currentDistance = (currentProgress / 100) * totalDistance;
      const point = turf.along(route, currentDistance, { units: 'kilometers' });
      const position = point.geometry.coordinates as [number, number];
      
      truckMarker.setLngLat(position);
      setTruckProgress(currentProgress);

      if (currentProgress < 100) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }, [createTruckMarker, animationSpeed]);

  // Add 3D buildings layer
  const add3DBuildingsLayer = useCallback(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;
    
    // Only add if not already present
    if (map.current.getLayer('3d-buildings')) return;
    
    const layers = map.current.getStyle().layers;
    const labelLayerId = layers?.find(
      (layer) => layer.type === 'symbol' && layer.layout?.['text-field']
    )?.id;

    map.current.addLayer(
      {
        id: '3d-buildings',
        source: 'composite',
        'source-layer': 'building',
        filter: ['==', 'extrude', 'true'],
        type: 'fill-extrusion',
        minzoom: 15,
        paint: {
          'fill-extrusion-color': [
            'interpolate',
            ['linear'],
            ['get', 'height'],
            0, '#d9d9d9',
            50, '#c6c6c6',
            100, '#b3b3b3',
            200, '#999999'
          ],
          'fill-extrusion-height': [
            'interpolate',
            ['linear'],
            ['zoom'],
            15,
            0,
            15.05,
            ['get', 'height'],
          ],
          'fill-extrusion-base': [
            'interpolate',
            ['linear'],
            ['zoom'],
            15,
            0,
            15.05,
            ['get', 'min_height'],
          ],
          'fill-extrusion-opacity': 0.7,
          'fill-extrusion-ambient-occlusion-intensity': 0.3,
          'fill-extrusion-ambient-occlusion-radius': 3,
        },
      },
      labelLayerId
    );
  }, []);

  const switchToStreetView = useCallback((route: Feature<LineString>, routeType?: string) => {
    if (!map.current) return;
    
    console.log(`🚀 Focusing on ${routeType || 'navigation'} route segment only`);
    console.log('📏 Route has', route.geometry.coordinates.length, 'coordinates');
    
    // Keep vessel tracking routes visible but dimmed, keep pickup/delivery routes highlighted
    vessels.forEach((vessel) => {
      ['historic', 'historic-glow', 'historic-points', 'predicted', 'predicted-glow', 'predicted-points', 'tracking'].forEach((suffix) => {
        const layerId = `${suffix}-${vessel.id}`;
        if (map.current?.getLayer(layerId)) {
          map.current.setLayoutProperty(layerId, 'visibility', 'visible');
          // Dim the vessel tracking routes to focus on pickup/delivery
          try {
            if (suffix.includes('historic') || suffix.includes('predicted') || suffix.includes('tracking')) {
              const layer = map.current.getLayer(layerId);
              if (layer && layer.type === 'line') {
                map.current.setPaintProperty(layerId, 'line-opacity', 0.9);
                console.log('🔆 Highlighting vessel tracking:', layerId, 'at 90%');
              }
            }
            if (suffix.includes('points')) {
              // Check if layer has circle-opacity property before setting it
              const layer = map.current.getLayer(layerId);
              if (layer && layer.type === 'circle') {
                map.current.setPaintProperty(layerId, 'circle-opacity', 0.85);
                console.log('🔆 Highlighting vessel points:', layerId, 'at 85%');
              }
            }
          } catch (error) {
            console.log('⚠️ Could not set paint property for layer:', layerId, error);
          }
        }
      });
      
      // Show only the relevant pickup or delivery route with enhanced styling
      if (routeType && (routeType.includes('Pickup') || routeType.includes('pickup') || routeType.includes('Origin'))) {
        console.log('📦 Showing pickup navigation route for vessel:', vessel.id);
        // Ensure pickup route and glow are visible
        const pickupLayerId = `pickup-nav-${vessel.id}`;
        const pickupGlowId = `pickup-nav-glow-${vessel.id}`;
        if (map.current?.getLayer(pickupGlowId)) {
          console.log('✅ Making pickup glow visible and bright');
          map.current.setLayoutProperty(pickupGlowId, 'visibility', 'visible');
          map.current.setPaintProperty(pickupGlowId, 'line-opacity', 0.6);
        }
        if (map.current?.getLayer(pickupLayerId)) {
          console.log('✅ Making pickup route visible and highlighted');
          map.current.setLayoutProperty(pickupLayerId, 'visibility', 'visible');
          map.current.setPaintProperty(pickupLayerId, 'line-opacity', 1.0);
          map.current.setPaintProperty(pickupLayerId, 'line-width', 8);
          // Bring to front
          map.current.moveLayer(pickupLayerId);
        } else {
          console.log('⚠️ Pickup layer not found:', pickupLayerId);
        }
        // Keep delivery route visible but dimmed
        const deliveryLayerId = `delivery-nav-${vessel.id}`;
        const deliveryGlowId = `delivery-nav-glow-${vessel.id}`;
        if (map.current?.getLayer(deliveryLayerId)) {
          map.current.setLayoutProperty(deliveryLayerId, 'visibility', 'visible');
          map.current.setPaintProperty(deliveryLayerId, 'line-opacity', 0.3);
        }
        if (map.current?.getLayer(deliveryGlowId)) {
          map.current.setLayoutProperty(deliveryGlowId, 'visibility', 'visible');
          map.current.setPaintProperty(deliveryGlowId, 'line-opacity', 0.1);
        }
      } else if (routeType && (routeType.includes('Delivery') || routeType.includes('delivery') || routeType.includes('Destination'))) {
        console.log('🚚 Showing delivery navigation route for vessel:', vessel.id);
        // Ensure delivery route and glow are visible
        const deliveryLayerId = `delivery-nav-${vessel.id}`;
        const deliveryGlowId = `delivery-nav-glow-${vessel.id}`;
        if (map.current?.getLayer(deliveryGlowId)) {
          console.log('✅ Making delivery glow visible and bright');
          map.current.setLayoutProperty(deliveryGlowId, 'visibility', 'visible');
          map.current.setPaintProperty(deliveryGlowId, 'line-opacity', 0.6);
        }
        if (map.current?.getLayer(deliveryLayerId)) {
          console.log('✅ Making delivery route visible and highlighted');
          map.current.setLayoutProperty(deliveryLayerId, 'visibility', 'visible');
          map.current.setPaintProperty(deliveryLayerId, 'line-opacity', 1.0);
          map.current.setPaintProperty(deliveryLayerId, 'line-width', 8);
          // Bring to front
          map.current.moveLayer(deliveryLayerId);
        } else {
          console.log('⚠️ Delivery layer not found:', deliveryLayerId);
        }
        // Keep pickup route visible but dimmed
        const pickupLayerId = `pickup-nav-${vessel.id}`;
        const pickupGlowId = `pickup-nav-glow-${vessel.id}`;
        if (map.current?.getLayer(pickupLayerId)) {
          map.current.setLayoutProperty(pickupLayerId, 'visibility', 'visible');
          map.current.setPaintProperty(pickupLayerId, 'line-opacity', 0.3);
        }
        if (map.current?.getLayer(pickupGlowId)) {
          map.current.setLayoutProperty(pickupGlowId, 'visibility', 'visible');
          map.current.setPaintProperty(pickupGlowId, 'line-opacity', 0.1);
        }
      } else {
        console.log('⚠️ No route type specified or unrecognized:', routeType);
        // If no specific route type, ensure both pickup and delivery routes are visible
        const pickupLayerId = `pickup-nav-${vessel.id}`;
        const pickupGlowId = `pickup-nav-glow-${vessel.id}`;
        const deliveryLayerId = `delivery-nav-${vessel.id}`;
        const deliveryGlowId = `delivery-nav-glow-${vessel.id}`;
        
        [pickupLayerId, pickupGlowId, deliveryLayerId, deliveryGlowId].forEach(layerId => {
          if (map.current?.getLayer(layerId)) {
            map.current.setLayoutProperty(layerId, 'visibility', 'visible');
          }
        });
      }
    });
    
    // Hide only vessel markers, keep route markers visible for endpoints
    markersRef.current.forEach(marker => {
      const element = marker.getElement();
      if (element) element.style.display = 'none';
    });
    
    // Keep route markers visible but with enhanced styling for 3D
    Object.values(routeMarkersRef.current).forEach(markers => 
      markers.forEach(marker => {
        const element = marker.getElement();
        if (element) {
          element.style.display = 'block';
          element.style.zIndex = '1000';
          // Add enhanced 3D glow effect to markers
          element.style.filter = 'brightness(2) drop-shadow(0 0 20px rgba(255, 255, 0, 0.8)) drop-shadow(0 8px 16px rgba(0,0,0,0.6))';
          element.style.transform = 'scale(1.2)';
          element.style.transition = 'all 0.5s ease';
        }
      })
    );
    
    // Enable 3D view
    if (!is3DView) {
      setIs3DView(true);
    }
    
    const setupNavigationRoute = () => {
      if (!map.current || !route) return;
      
      // Skip creating navigation route layers since we're using pickup/delivery routes
      // The pickup/delivery routes are already styled and visible
      console.log('📍 Navigation route setup skipped - using pickup/delivery routes');

      // Focus on the route and transition to 3D
      const bounds = new mapboxgl.LngLatBounds();
      route.geometry.coordinates.forEach((coord) => {
        bounds.extend(coord as [number, number]);
      });

      // First fit the bounds to focus on the route with smooth animation
      if (!bounds.isEmpty()) {
        console.log('📍 Zooming into route with smooth animation');
        
        // Start with a zoom out to show context
        map.current.flyTo({
          center: route.geometry.coordinates[Math.floor(route.geometry.coordinates.length / 2)] as [number, number],
          zoom: map.current.getZoom() - 1,
          pitch: 45,
          bearing: -15,
          duration: 800,
          essential: true
        });
        
        // Then zoom in to the route
        setTimeout(() => {
          map.current!.fitBounds(bounds, {
            padding: { top: 100, bottom: 100, left: 300, right: 100 },
            maxZoom: 13.5,
            duration: 1500,
            animate: true,
            essential: true,
            easing: (t) => {
              // Custom easing for smoother zoom
              return t < 0.5 
                ? 4 * t * t * t 
                : 1 - Math.pow(-2 * t + 2, 3) / 2;
            }
          });
        }, 600);
      }

      // Then transition to 3D view with a smooth animation
      setTimeout(() => {
        if (!map.current) return;
        console.log('🎯 Transitioning to 3D view with dynamic lighting');
        
        // Apply time-of-day lighting presets
        const applyLightingPreset = (preset?: 'dawn' | 'day' | 'dusk' | 'night' | null) => {
          if (!map.current) return;
          const presets = {
            dawn: {
              fog: {
                'range': [0.5, 10],
                'color': 'rgb(255, 194, 158)', // Warm orange-pink
                'horizon-blend': 0.15,
                'high-color': '#ff9a56',
                'space-color': '#402a44',
                'star-intensity': 0.1
              },
              light: {
                'anchor': 'viewport',
                'color': '#ffb783',
                'intensity': 0.7,
                'position': [1.5, 90, 40]
              }
            },
            day: {
              fog: {
                'range': [0.8, 12],
                'color': 'rgb(220, 235, 245)', // Bright blue-white
                'horizon-blend': 0.05,
                'high-color': '#4A90E2',
                'space-color': '#000033',
                'star-intensity': 0
              },
              light: {
                'anchor': 'viewport',
                'color': 'white',
                'intensity': 0.5,
                'position': [1.5, 180, 80]
              }
            },
            dusk: {
              fog: {
                'range': [0.4, 9],
                'color': 'rgb(241, 163, 132)', // Sunset orange
                'horizon-blend': 0.2,
                'high-color': '#8b4d8b',
                'space-color': '#1a0033',
                'star-intensity': 0.3
              },
              light: {
                'anchor': 'viewport',
                'color': '#ff8c42',
                'intensity': 0.65,
                'position': [1.5, 270, 45]
              }
            },
            night: {
              fog: {
                'range': [0.3, 8],
                'color': 'rgb(20, 30, 60)', // Dark blue
                'horizon-blend': 0.1,
                'high-color': '#0a1551',
                'space-color': '#000000',
                'star-intensity': 0.6
              },
              light: {
                'anchor': 'viewport',
                'color': '#6B8CFF',
                'intensity': 0.3,
                'position': [1.5, 45, 65]
              }
            }
          };
          
          // Auto-detect time of day
          const hour = new Date().getHours();
          let selectedPreset = preset || 'day';
          if (!preset) {
            if (hour >= 5 && hour < 7) selectedPreset = 'dawn';
            else if (hour >= 7 && hour < 17) selectedPreset = 'day';
            else if (hour >= 17 && hour < 20) selectedPreset = 'dusk';
            else selectedPreset = 'night';
          }
          
          const settings = presets[selectedPreset];
          map.current.setFog(settings.fog as any);
          map.current.setLight(settings.light as any);
          
          console.log(`🌅 Applied ${selectedPreset} lighting preset`);
        };
        
        // Apply auto-detected lighting
        applyLightingPreset(null);
        
        // Ensure 3D transition happens
        if (map.current) {
          map.current.easeTo({
            pitch: 60,
            bearing: -17,
            duration: 1500,
            easing: (t) => t * (2 - t), // Smooth easing function
          });
          console.log('📐 3D transition initiated with pitch: 60°');
        }
      }, 2200);  // Wait for zoom animation to complete

      // Add 3D terrain for enhanced depth perception
      setTimeout(() => {
        if (!map.current) return;
        
        console.log('🏔️ Adding 3D terrain and buildings');
        
        // Remove existing terrain first if present
        if (map.current.getTerrain()) {
          map.current.setTerrain(null);
        }
        
        // Add terrain source only if it doesn't exist
        if (!map.current.getSource('mapbox-dem')) {
          map.current.addSource('mapbox-dem', {
            type: 'raster-dem',
            url: 'mapbox://mapbox.terrain-rgb',
            tileSize: 512,
            maxzoom: 14,
          });
          console.log('✅ Terrain source added');
        }
        
        // Set or update terrain with exaggeration for dramatic effect
        map.current.setTerrain({ 
          source: 'mapbox-dem', 
          exaggeration: 1.8  // Increased for more dramatic 3D effect
        });
        
        // Add 3D buildings layer
        add3DBuildingsLayer();
        console.log('🏢 3D features fully enabled');
      }, 1200);
    };

    // Call setup immediately since we're not switching styles
    setupNavigationRoute();
  }, [vessels, is3DView, add3DBuildingsLayer]);

  // Toggle 3D view mode
  const toggle3DView = useCallback(() => {
    if (!map.current) return;
    
    const new3DState = !is3DView;
    setIs3DView(new3DState);
    
    // Animate transition to 3D or back to 2D
    map.current.easeTo({
      pitch: new3DState ? 65 : 0,
      bearing: new3DState ? -20 : 0,
      duration: 2000,
    });
    
    // Add or remove 3D buildings
    if (new3DState) {
      setTimeout(() => {
        add3DBuildingsLayer();
      }, 500);
    } else {
      if (map.current.getLayer('3d-buildings')) {
        map.current.removeLayer('3d-buildings');
      }
    }
  }, [is3DView, add3DBuildingsLayer]);

  const switchToDefaultView = useCallback(() => {
    if (!map.current) return;
    
    console.log('🗺️ Returning to 2D Default View');
    
    // Remove navigation route layers
    if (map.current.getLayer('navigation-route')) {
      map.current.removeLayer('navigation-route');
    }
    if (map.current.getLayer('navigation-route-outline')) {
      map.current.removeLayer('navigation-route-outline');
    }
    if (map.current.getSource('navigation-route')) {
      map.current.removeSource('navigation-route');
    }
    
    // Disable 3D view when returning to default
    if (is3DView) {
      setIs3DView(false);
    }
    
    // Smooth transition back to 2D view
    map.current.easeTo({
      pitch: 0,
      bearing: 0,
      duration: 1500,
      easing: (t) => t * (2 - t),
    });
    
    // Remove terrain and source properly
    setTimeout(() => {
      if (!map.current) return;
      
      if (map.current.getTerrain()) {
        map.current.setTerrain(null);
      }
      
      // Don't remove the terrain source, just keep it for reuse
      // This avoids the "source not found" error when switching between views
      
      // Remove 3D buildings
      if (map.current.getLayer('3d-buildings')) {
        map.current.removeLayer('3d-buildings');
      }
      
      // Reset lighting and fog to default
      map.current.setFog(null);
      map.current.setLight({
        'anchor': 'viewport',
        'color': 'white',
        'intensity': 0.4,
        'position': [1.5, 90, 30]
      });
    }, 100);
    
    // Remove truck marker when switching back
    if (truckMarkerRef.current) {
      truckMarkerRef.current.remove();
      truckMarkerRef.current = null;
    }
    setNavigationMode(null);
    setTruckProgress(0);
    
    setTimeout(() => {
      // Restore all vessel tracking routes
      updateVesselRoutes();
      
      // Restore all vessel tracking routes and pickup/delivery routes to full visibility
      vessels.forEach((vessel) => {
        ['historic', 'historic-glow', 'historic-points', 'predicted', 'predicted-glow', 'predicted-points', 'tracking'].forEach((suffix) => {
          const layerId = `${suffix}-${vessel.id}`;
          if (map.current?.getLayer(layerId)) {
              map.current.setLayoutProperty(layerId, 'visibility', 'visible');
            }
          });
          
          // Restore pickup and delivery routes to normal visibility and opacity
          const pickupLayerId = `pickup-nav-${vessel.id}`;
          const pickupGlowId = `pickup-nav-glow-${vessel.id}`;
          if (map.current?.getLayer(pickupLayerId)) {
            map.current.setLayoutProperty(pickupLayerId, 'visibility', 'visible');
            map.current.setPaintProperty(pickupLayerId, 'line-opacity', 0.9);
            map.current.setPaintProperty(pickupLayerId, 'line-width', 6); // Reset to normal width
          }
          if (map.current?.getLayer(pickupGlowId)) {
            map.current.setLayoutProperty(pickupGlowId, 'visibility', 'visible');
            map.current.setPaintProperty(pickupGlowId, 'line-opacity', 0.3);
          }
          
          const deliveryLayerId = `delivery-nav-${vessel.id}`;
          const deliveryGlowId = `delivery-nav-glow-${vessel.id}`;
          if (map.current?.getLayer(deliveryLayerId)) {
            map.current.setLayoutProperty(deliveryLayerId, 'visibility', 'visible');
            map.current.setPaintProperty(deliveryLayerId, 'line-opacity', 0.9);
            map.current.setPaintProperty(deliveryLayerId, 'line-width', 6); // Reset to normal width
          }
          if (map.current?.getLayer(deliveryGlowId)) {
            map.current.setLayoutProperty(deliveryGlowId, 'visibility', 'visible');
            map.current.setPaintProperty(deliveryGlowId, 'line-opacity', 0.3);
          }
        });
        
        // Restore all vessel and route markers
        markersRef.current.forEach(marker => {
          const element = marker.getElement();
          if (element) element.style.display = 'block';
        });
        Object.values(routeMarkersRef.current).forEach(markers => 
          markers.forEach(marker => {
            const element = marker.getElement();
            if (element) {
              element.style.display = 'block';
              element.style.zIndex = '';  // Reset z-index
              element.style.filter = '';  // Reset shadow effect
              element.style.transform = '';  // Reset scale
              element.style.transition = '';  // Reset transition
            }
          })
        );
      }, 500);
  }, [vessels, is3DView, updateVesselRoutes]);

  const handleAddressNavigationToggle = useCallback(
    async (type: AddressNavType) => {
      console.log('🚀 handleAddressNavigationToggle called with type:', type);
      console.log('🔍 mapboxToken exists:', !!mapboxToken);
      
      if (!mapboxToken) {
        console.log('❌ No mapboxToken, returning early');
        return;
      }

      const isPickup = type === 'pickup';
      const address = isPickup ? parsedAddresses.pickup : parsedAddresses.delivery;
      console.log('📍 Address found:', !!address, address);
      if (!address) {
        console.log('❌ No address found, returning early');
        return;
      }

      const portCoordinate = isPickup ? originCoordinate : destinationCoordinate;
      if (!portCoordinate) return;

      let coordinate = isPickup
        ? addressLocations.pickup?.coordinate
        : addressLocations.delivery?.coordinate;

      const targetVesselId = vessels[0]?.id;
      if (targetVesselId) {
        setExpandedVessel(targetVesselId);
      }

      if (!coordinate) {
        try {
          const resolved = await geocodeAddress(address);
          if (resolved) {
            coordinate = resolved;
            setAddressLocations((prev) => ({
              ...prev,
              [type]: { ...address, coordinate: resolved },
            }));
          }
        } catch (error) {
          console.error('Failed to geocode address on navigation toggle', error);
          return;
        }
      }

      if (!coordinate) return;

      const routeKey = isPickup ? 'pickupToOrigin' : 'destinationToDelivery';
      let currentRoute = addressRoutes[routeKey];

      if (!currentRoute) {
        try {
          const start = isPickup ? coordinate : portCoordinate;
          const end = isPickup ? portCoordinate : coordinate;
          const route = await fetchDirections(start, end);
          if (route) {
            currentRoute = route;
            setAddressRoutes((prev) => ({
              ...prev,
              [routeKey]: route,
            }));
          }
        } catch (error) {
          console.error('Failed to fetch directions on navigation toggle', error);
          return;
        }
      }

      if (currentRoute) {
        console.log('✅ Route fetched successfully:', currentRoute);
        console.log('📊 Route coordinates count:', currentRoute.geometry.coordinates.length);
        
        const nextState = {
          ...activeNavigation,
          [type]: true,
        } as Record<AddressNavType, boolean>;

        setActiveNavigation(nextState);

        // Store route for potential future use but do NOT change map view
        activeNavigationRouteRef.current = {
          feature: currentRoute,
          type,
        };

        // Calculate segment data using the fetched/existing route
        const distance = turf.length(currentRoute, { units: 'kilometers' });
        const emissions = distance * 0.262;
        const drayageCost = distance * 5.5;
        const travelTime = Math.round((distance / 45) * 60);

        const segmentData = {
          distance: distance.toFixed(1),
          emissions: emissions.toFixed(1),
          cost: Math.round(drayageCost),
          travelTime,
        };

        // Only update sidebar data and mode; leave map camera & layers unchanged
        onSegmentDataChange?.(segmentData);
        if (isPickup) {
          onAddressViewChange?.('supplier');
        } else {
          onAddressViewChange?.('buyer');
        }
      } else {
        onAddressViewChange?.('default');
        onSegmentDataChange?.(null);
        activeNavigationRouteRef.current = null;
      }
    },
    [
      mapboxToken,
      activeNavigation,
      addressLocations,
      addressRoutes,
      destinationCoordinate,
      fetchDirections,
      geocodeAddress,
      onAddressViewChange,
      onSegmentDataChange,
      originCoordinate,
      vessels,
      calculateSegmentData,
      switchToStreetView,
      animateTruckAlongRoute,
    ]
  );

  useEffect(() => {
    const initial: Record<string, number> = {};
    vessels.forEach(v => { initial[v.id] = v.progress ?? 0; });
    setVesselProgress(initial);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mapContainer.current || !isTokenSet || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;
    setMapError(null);

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11', // Dark style for dramatic effect like SF Ships
      projection: 'mercator',
      center: [60, 40], // Center between China and UK
      zoom: 2.5,
      pitch: 0, // Start in 2D view
      bearing: 0, // No rotation initially
      antialias: true, // Smooth edges
    });

    // Add zoom controls with animation
    map.current.addControl(new mapboxgl.NavigationControl({
      visualizePitch: true
    }), 'top-right');

    // Configure smooth scroll zoom
    map.current.scrollZoom.setWheelZoomRate(1 / 600); // Slower, smoother zoom
    map.current.scrollZoom.setZoomRate(1 / 100); // Smooth zoom transitions
    
    // Add smooth zoom animation on scroll
    let zoomTimeout: NodeJS.Timeout;
    map.current.on('wheel', () => {
      clearTimeout(zoomTimeout);
      zoomTimeout = setTimeout(() => {
        const currentZoom = map.current?.getZoom() || 0;
        map.current?.easeTo({
          zoom: currentZoom,
          duration: 300,
          easing: (t) => t * (2 - t)
        });
      }, 150);
    });

    map.current.on('error', (e) => {
      const msg = (e as any)?.error?.message || 'Failed to load Mapbox map. Please confirm your public token (starts with pk.).';
      setMapError(msg);
    });

    map.current.on('load', () => {
      setIsMapReady(true);
      // Update country label colors to white for visibility
      const labelLayers = [
        'country-label',
        'state-label',
        'settlement-label',
        'settlement-subdivision-label',
        'airport-label',
        'poi-label',
        'water-point-label',
        'water-line-label',
        'waterway-label',
        'natural-line-label',
        'natural-point-label'
      ];
      
      labelLayers.forEach(layerId => {
        if (map.current?.getLayer(layerId)) {
          map.current.setPaintProperty(layerId, 'text-color', '#ffffff');
          map.current.setPaintProperty(layerId, 'text-halo-color', '#000000');
          map.current.setPaintProperty(layerId, 'text-halo-width', 2);
        }
      });
      
      // Add country highlighting for POL (China) and POD (UK)
      // Similar to isochrone demo styling
      map.current.addSource('countries', {
        type: 'vector',
        url: 'mapbox://mapbox.country-boundaries-v1'
      });

      // Highlight China (Port of Loading country) with isochrone-style colors
      map.current.addLayer({
        id: 'country-pol',
        type: 'fill',
        source: 'countries',
        'source-layer': 'country_boundaries',
        filter: ['==', 'iso_3166_1', ''],
        paint: {
          'fill-color': '#5E4FA2',  // Deep purple like isochrone demo
          'fill-opacity': 0.25
        }
      }, 'admin-1-boundary-bg');

      // Add China border with subtle glow
      map.current.addLayer({
        id: 'country-pol-border',
        type: 'line',
        source: 'countries',
        'source-layer': 'country_boundaries',
        filter: ['==', 'iso_3166_1', ''],
        paint: {
          'line-color': '#9E75F0',  // Lighter purple border
          'line-width': 2,
          'line-opacity': 0.6,
          'line-blur': 0.5
        }
      });

      // Highlight UK (Port of Discharge country) with isochrone-style colors
      map.current.addLayer({
        id: 'country-pod',
        type: 'fill',
        source: 'countries',
        'source-layer': 'country_boundaries',
        filter: ['==', 'iso_3166_1', ''],
        paint: {
          'fill-color': '#3182CE',  // Professional blue like isochrone demo
          'fill-opacity': 0.25
        }
      }, 'admin-1-boundary-bg');

      // Add UK border with subtle glow
      map.current.addLayer({
        id: 'country-pod-border',
        type: 'line',
        source: 'countries',
        'source-layer': 'country_boundaries',
        filter: ['==', 'iso_3166_1', ''],
        paint: {
          'line-color': '#63B3ED',  // Lighter blue border
          'line-width': 2,
          'line-opacity': 0.6,
          'line-blur': 0.5
        }
      });

      if (!isAirMode && !isRoadMode) {
        addVesselMarkers();
        updateVesselRoutes();
      }
      
      // Animate dash arrays for predicted routes
      let dashArraySequence = [
        [0, 4, 3],
        [1, 4, 2],
        [2, 4, 1],
        [3, 4, 0],
        [0, 4, 3]
      ];
      let step = 0;
      
      const animateDashArray = () => {
        const newStep = (step + 1) % dashArraySequence.length;
        
        vessels.forEach(vessel => {
          const predictedLayerId = `predicted-${vessel.id}`;
          if (map.current?.getLayer(predictedLayerId)) {
            map.current.setPaintProperty(
              predictedLayerId,
              'line-dasharray',
              dashArraySequence[step]
            );
          }
        });
        
        step = newStep;
      };
      
      // Start animation
      if (!isAirMode && !isRoadMode) {
        if (dashAnimationRef.current) {
          clearInterval(dashAnimationRef.current);
        }
        dashAnimationRef.current = window.setInterval(animateDashArray, 100);
      }
      
      // Add 3D buildings layer if in 3D view (Sea-only here; Road adds its own 3D)
      if (is3DView && !isAirMode && !isRoadMode) {
        add3DBuildingsLayer();
      }
    });

    // Auto-switch to street view when zooming into pickup/delivery routes
    let zoomCheckTimeout: NodeJS.Timeout | null = null;
    map.current.on('zoomend', () => {
      if (!map.current || navigationMode) return;
      
      // Debounce to avoid multiple triggers
      if (zoomCheckTimeout) clearTimeout(zoomCheckTimeout);
      
      zoomCheckTimeout = setTimeout(() => {
        if (!map.current) return;
        
        const zoom = map.current.getZoom();
        const center = map.current.getCenter();
        
        // Check if zoomed in (zoom > 8 for better UX)
        if (zoom > 8) {
          const pickupCoord = addressLocations.pickup?.coordinate;
          const deliveryCoord = addressLocations.delivery?.coordinate;
          const pickupRoute = addressRoutes.pickupToOrigin;
          const deliveryRoute = addressRoutes.destinationToDelivery;
          
          // Check if center is near pickup route (within 50km)
          if (pickupCoord && originCoordinate && pickupRoute) {
            const distanceToPickup = turf.distance(
              turf.point([center.lng, center.lat]),
              turf.point(pickupCoord),
              { units: 'kilometers' }
            );
            const distanceToOrigin = turf.distance(
              turf.point([center.lng, center.lat]),
              turf.point(originCoordinate),
              { units: 'kilometers' }
            );
            
            if (distanceToPickup < 50 || distanceToOrigin < 50) {
              setNavigationMode('pickup');
              switchToStreetView(pickupRoute);
              
              // Calculate and send segment data
              const distance = turf.length(pickupRoute, { units: 'kilometers' });
              const emissions = distance * 0.262;
              const drayageCost = distance * 5.5;
              const travelTime = Math.round((distance / 45) * 60);
              onSegmentDataChange?.({
                distance: distance.toFixed(1),
                emissions: emissions.toFixed(1),
                cost: Math.round(drayageCost),
                travelTime,
              });
              onAddressViewChange?.('supplier');
              
              setTimeout(() => {
                if (map.current) {
                  animateTruckAlongRoute(pickupRoute, 0, true);
                }
              }, 1000);
              return;
            }
          }
          
          // Check if center is near delivery route (within 50km)
          if (deliveryCoord && destinationCoordinate && deliveryRoute) {
            const distanceToDelivery = turf.distance(
              turf.point([center.lng, center.lat]),
              turf.point(deliveryCoord),
              { units: 'kilometers' }
            );
            const distanceToDestination = turf.distance(
              turf.point([center.lng, center.lat]),
              turf.point(destinationCoordinate),
              { units: 'kilometers' }
            );
            
            if (distanceToDelivery < 50 || distanceToDestination < 50) {
              setNavigationMode('delivery');
              switchToStreetView(deliveryRoute);
              
              // Calculate and send segment data
              const distance = turf.length(deliveryRoute, { units: 'kilometers' });
              const emissions = distance * 0.262;
              const drayageCost = distance * 5.5;
              const travelTime = Math.round((distance / 45) * 60);
              onSegmentDataChange?.({
                distance: distance.toFixed(1),
                emissions: emissions.toFixed(1),
                cost: Math.round(drayageCost),
                travelTime,
              });
              onAddressViewChange?.('buyer');
              
              setTimeout(() => {
                if (map.current) {
                  animateTruckAlongRoute(deliveryRoute, 0, false);
                }
              }, 1000);
              return;
            }
          }
        }
      }, 300);
    });

    return () => {
      if (dashAnimationRef.current) {
        clearInterval(dashAnimationRef.current);
        dashAnimationRef.current = null;
      }
      markersRef.current.forEach(marker => marker.remove());
      Object.values(routeMarkersRef.current).forEach(markers => 
        markers.forEach(marker => marker.remove())
      );
      map.current?.remove();
    };
  }, [
    isTokenSet,
    mapboxToken,
  ]);

  // Update routes when expandedVessel changes
  useEffect(() => {
    if (map.current && map.current.isStyleLoaded()) {
      // Only update routes if not currently animating to avoid conflicts
      if (!animatingVessel) {
        updateVesselRoutes();
      }
    }
  }, [expandedVessel]);

  // Update routes when address routes or locations change
  useEffect(() => {
    if (map.current && map.current.isStyleLoaded() && !animatingVessel) {
      updateVesselRoutes();
    }
  }, [addressRoutes, addressLocations]);

  // Vessel movement is now manual/real-time based on actual tracking data
  // Coordinates update infrequently (typically once per day or so)
  // Removed automatic progress simulation - vessel position is controlled by progress prop

  // Update vessel marker positions when progress changes
  // Don't update routes here to avoid conflicts with click handler
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;
    if (animatingVessel) return; // Don't update during animation

    vessels.forEach((vessel) => {
      const marker = vesselMarkersRef.current[vessel.id];
      if (marker) {
        const latestHistoric = getLatestHistoricCoordinate(vessel);
        const vesselPosition = latestHistoric ?? calculateVesselPosition(vessel);
        marker.setLngLat(vesselPosition);
      }
    });

    // Only update routes if vessel is expanded and not animating
    if (expandedVessel && !animatingVessel) {
      updateVesselRoutes();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vesselProgress]);

  // Build and render an air route for active air shipments
  useEffect(() => {
    if (!map.current || !mapboxToken || !isMapReady) return;

    if (!isAirMode) {
      // Clean up any existing air route/marker when leaving air mode
      if (map.current.getLayer('air-route-line')) {
        map.current.removeLayer('air-route-line');
      }
      if (map.current.getSource('air-route')) {
        map.current.removeSource('air-route');
      }
      if (map.current.getLayer('air-route-points')) {
        map.current.removeLayer('air-route-points');
      }
      if (map.current.getSource('air-route-points')) {
        map.current.removeSource('air-route-points');
      }
      if (planeMarkerRef.current) {
        planeMarkerRef.current.remove();
        planeMarkerRef.current = null;
      }
      airRouteRef.current = null;
      hasShownAirToastRef.current = false;

      // Re-apply Sea-mode origin/destination country highlighting when not in Air mode
      const seaOriginCountry = originPortCode.slice(0, 2).toUpperCase();
      const seaDestCountry = destinationPortCode.slice(0, 2).toUpperCase();

      if (map.current.getLayer('country-pol')) {
        map.current.setFilter('country-pol', ['==', 'iso_3166_1', seaOriginCountry]);
      }
      if (map.current.getLayer('country-pol-border')) {
        map.current.setFilter('country-pol-border', ['==', 'iso_3166_1', seaOriginCountry]);
      }
      if (map.current.getLayer('country-pod')) {
        map.current.setFilter('country-pod', ['==', 'iso_3166_1', seaDestCountry]);
      }
      if (map.current.getLayer('country-pod-border')) {
        map.current.setFilter('country-pod-border', ['==', 'iso_3166_1', seaDestCountry]);
      }

      // eslint-disable-next-line no-console
      console.log('[SEA] country highlights applied', { seaOriginCountry, seaDestCountry });

      return;
    }

    const airFlight = activeAirFlight;
    if (!airFlight) return;

    const dep = airFlight.departure ?? {};
    const arr = airFlight.arrival ?? {};
    const originText = dep.iata ? `${dep.iata} airport` : dep.airport ?? '';
    const destText = arr.iata ? `${arr.iata} airport` : arr.airport ?? '';
    if (!originText || !destText) return;

    // Debug: verify Air effect is running and we have valid origin/destination labels
    // eslint-disable-next-line no-console
    console.log('[AIR] effect active', {
      isAirMode,
      isMapReady,
      hasMap: !!map.current,
      originText,
      destText,
    });

    let cancelled = false;

    const setup = async () => {
      try {
        if (!map.current) return;

        // eslint-disable-next-line no-console
        console.log('[AIR] setup start', { originText, destText });

        let originCoord = await geocodePlace(originText);
        let destCoord = await geocodePlace(destText);

        if (cancelled || !map.current) return;

        // For the current demo flight YVR → LHR, always override to the precise coordinates
        const depIata = airFlight.departure?.iata?.toUpperCase();
        const arrIata = airFlight.arrival?.iata?.toUpperCase();
        if (depIata === 'YVR' && arrIata === 'LHR') {
          // Vancouver International (YVR): 49.1935° N, 123.1840° W
          originCoord = [-123.1840, 49.1935];
          // London Heathrow (LHR/EGLL): 51.4706° N, 0.4619° W
          destCoord = [-0.4619, 51.4706];
        }

        if (cancelled || !map.current || !originCoord || !destCoord) return;

        // eslint-disable-next-line no-console
        console.log('[AIR] coordinates resolved', { originCoord, destCoord });

        let [originCountry, destCountry] = await Promise.all([
          reverseGeocodeCountryName(originCoord),
          reverseGeocodeCountryName(destCoord),
        ]);

        // For the current demo flight YVR → LHR, force the correct country codes
        if (depIata === 'YVR') {
          originCountry = 'CA';
        }
        if (arrIata === 'LHR') {
          destCountry = 'GB';
        }

        const midLng = (originCoord[0] + destCoord[0]) / 2;
        const midLat = (originCoord[1] + destCoord[1]) / 2 + 25; // lift for arc (more pronounced curve)
        const controlPoint: [number, number] = [midLng, midLat];

        // Prefer a great-circle style arc when available, fallback to Bezier with a lifted control point
        let curved: Feature<LineString>;
        if ((turf as any).greatCircle) {
          const gc = (turf as any).greatCircle(
            turf.point(originCoord),
            turf.point(destCoord),
            { npoints: 128 },
          ) as Feature<LineString>;
          curved = gc;
        } else {
          const baseLine = turf.lineString([
            originCoord,
            controlPoint,
            destCoord,
          ]);
          curved = (turf as any).bezierSpline
            ? ((turf as any).bezierSpline(baseLine) as Feature<LineString>)
            : baseLine;
        }

        airRouteRef.current = curved;

        if (map.current.getSource('air-route')) {
          (map.current.getSource('air-route') as mapboxgl.GeoJSONSource).setData(
            curved as any,
          );
        } else {
          map.current.addSource('air-route', {
            type: 'geojson',
            data: curved,
          });
        }

        if (!map.current.getLayer('air-route-line')) {
          map.current.addLayer({
            id: 'air-route-line',
            type: 'line',
            source: 'air-route',
            layout: {
              'line-cap': 'round',
              'line-join': 'round',
            },
            paint: {
              'line-color': '#facc15',
              'line-width': 3,
              'line-opacity': 0.95,
              'line-blur': 1.1,
            },
          });
        }

        const pointFeatures = {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: { type: 'Point', coordinates: originCoord },
              properties: { type: 'origin' },
            },
            {
              type: 'Feature',
              geometry: { type: 'Point', coordinates: destCoord },
              properties: { type: 'destination' },
            },
          ],
        } as any;

        if (map.current.getSource('air-route-points')) {
          (map.current.getSource('air-route-points') as mapboxgl.GeoJSONSource).setData(
            pointFeatures,
          );
        } else {
          map.current.addSource('air-route-points', {
            type: 'geojson',
            data: pointFeatures,
          });
        }

        if (!map.current.getLayer('air-route-points')) {
          map.current.addLayer({
            id: 'air-route-points',
            type: 'circle',
            source: 'air-route-points',
            paint: {
              'circle-radius': 5,
              'circle-color': '#f97316',
              'circle-stroke-width': 2,
              'circle-stroke-color': '#0f172a',
            },
          });
        }

        const bounds = new mapboxgl.LngLatBounds();
        curved.geometry.coordinates.forEach((coord) => {
          bounds.extend(coord as [number, number]);
        });
        map.current.fitBounds(bounds, {
          padding: { top: 80, bottom: 80, left: 80, right: 80 },
          duration: 1000,
        });

        // eslint-disable-next-line no-console
        console.log('[AIR] fitBounds applied');

        let planeCoord: [number, number] = originCoord;
        const liveLat = airFlight.live?.latitude;
        const liveLng = airFlight.live?.longitude;

        if (typeof liveLat === 'number' && typeof liveLng === 'number') {
          planeCoord = [liveLng, liveLat];
        } else {
          const progress = computeDateBasedProgress(
            airFlight.departure?.scheduled ?? null,
            airFlight.arrival?.scheduled ?? null,
          );

          const total = turf.length(curved, { units: 'kilometers' });
          if (total > 0) {
            const distanceAlong = (progress / 100) * total;
            const point = turf.along(curved, distanceAlong, { units: 'kilometers' });
            const [lng, lat] = point.geometry.coordinates;
            planeCoord = [lng, lat];
          }
        }

        // eslint-disable-next-line no-console
        console.log('[AIR] plane coordinate chosen', { planeCoord, liveLat, liveLng });

        const planeEl = createMarkerElement(airIcon, { width: 56, height: 56 });
        if (planeMarkerRef.current) {
          planeMarkerRef.current.setLngLat(planeCoord as [number, number]);
        } else {
          planeMarkerRef.current = new mapboxgl.Marker({
            element: planeEl,
            anchor: 'center',
          })
            .setLngLat(planeCoord as [number, number])
            .addTo(map.current);
        }

        // Dynamically highlight origin/destination countries for Air shipments
        if (originCountry || destCountry) {
          if (originCountry) {
            if (map.current.getLayer('country-pol')) {
              map.current.setFilter('country-pol', ['==', 'iso_3166_1', originCountry]);
            }
            if (map.current.getLayer('country-pol-border')) {
              map.current.setFilter('country-pol-border', [
                '==',
                'iso_3166_1',
                originCountry,
              ]);
            }
          }
          if (destCountry) {
            if (map.current.getLayer('country-pod')) {
              map.current.setFilter('country-pod', ['==', 'iso_3166_1', destCountry]);
            }
            if (map.current.getLayer('country-pod-border')) {
              map.current.setFilter('country-pod-border', [
                '==',
                'iso_3166_1',
                destCountry,
              ]);
            }
          }
        }

        // eslint-disable-next-line no-console
        console.log('[AIR] country highlights applied', { originCountry, destCountry });

        if (!hasShownAirToastRef.current) {
          toast({
            title: 'Simulated air tracking',
            description:
              'Air shipment progress is estimated from ETD/ETA dates and does not use real-time GPS coordinates.',
          });
          hasShownAirToastRef.current = true;
        }
      } catch (error) {
        // Fail silently for now, just log for debugging
        // eslint-disable-next-line no-console
        console.error('Failed to render air route', error);
      }
    };

    setup();

    return () => {
      cancelled = true;
    };
  }, [
    activeShipment,
    geocodePlace,
    isAirMode,
    mapboxToken,
    reverseGeocodeCountryName,
    isMapReady,
  ]);

  // Move vessel marker along the voyage time series when the time slider changes
  useEffect(() => {
    if (!map.current || !trackTimeSeries.length) return;
    const vessel = vessels[0];
    if (!vessel) return;

    const marker = vesselMarkersRef.current[vessel.id];
    if (!marker) return;

    const clampedIndex = Math.min(
      Math.max(simulationIndex, 0),
      trackTimeSeries.length - 1,
    );
    const point = trackTimeSeries[clampedIndex];
    if (!point) return;

    marker.setLngLat(point.coord);
  }, [simulationIndex, vessels]);

  // Build and render a dedicated road route (Germany → France) for Road shipments
  useEffect(() => {
    if (!map.current || !mapboxToken || !isMapReady) return;

    if (!isRoadMode) {
      // eslint-disable-next-line no-console
      console.log('[ROAD] leaving road mode, cleaning up any existing road route');
      // Clean up any existing road route when leaving Road mode
      if (map.current.getLayer('road-route-line')) {
        map.current.removeLayer('road-route-line');
      }
      if (map.current.getLayer('road-route-outline')) {
        map.current.removeLayer('road-route-outline');
      }
      if (map.current.getSource('road-route')) {
        map.current.removeSource('road-route');
      }
      if (map.current.getLayer('road-route-origin')) {
        map.current.removeLayer('road-route-origin');
      }
      if (map.current.getSource('road-route-origin')) {
        map.current.removeSource('road-route-origin');
      }
      if (map.current.getLayer('road-route-destination')) {
        map.current.removeLayer('road-route-destination');
      }
      if (map.current.getSource('road-route-destination')) {
        map.current.removeSource('road-route-destination');
      }

      return;
    }

    let cancelled = false;

    const setupRoadRoute = async () => {
      try {
        if (!map.current) return;

        // eslint-disable-next-line no-console
        console.log('[ROAD] setupRoadRoute start', { isRoadMode, isMapReady, hasMap: !!map.current });

        // Approximate Germany → France route using Berlin → Paris
        const germanyCoord: [number, number] = [13.405, 52.52]; // Berlin
        const franceCoord: [number, number] = [2.3522, 48.8566]; // Paris

        const routeFeature = await fetchDirections(germanyCoord, franceCoord);
        if (!routeFeature || cancelled || !map.current) return;

        // eslint-disable-next-line no-console
        console.log('[ROAD] directions fetched', {
          pointCount: routeFeature.geometry.coordinates.length,
        });

        if (map.current.getSource('road-route')) {
          (map.current.getSource('road-route') as mapboxgl.GeoJSONSource).setData(
            routeFeature as any,
          );
        } else {
          map.current.addSource('road-route', {
            type: 'geojson',
            data: routeFeature,
          });
        }

        if (!map.current.getLayer('road-route-outline')) {
          map.current.addLayer({
            id: 'road-route-outline',
            type: 'line',
            source: 'road-route',
            layout: {
              'line-join': 'round',
              'line-cap': 'round',
            },
            paint: {
              'line-color': '#020617',
              'line-width': 6,
              'line-opacity': 0.85,
            },
          });
        }

        if (!map.current.getLayer('road-route-line')) {
          map.current.addLayer({
            id: 'road-route-line',
            type: 'line',
            source: 'road-route',
            layout: {
              'line-join': 'round',
              'line-cap': 'round',
            },
            paint: {
              'line-color': '#22c55e',
              'line-width': 4,
              'line-opacity': 0.95,
            },
          });
        }

        const originPoint = {
          type: 'Feature' as const,
          geometry: { type: 'Point' as const, coordinates: germanyCoord },
          properties: {},
        };
        const destinationPoint = {
          type: 'Feature' as const,
          geometry: { type: 'Point' as const, coordinates: franceCoord },
          properties: {},
        };

        if (map.current.getSource('road-route-origin')) {
          (map.current.getSource('road-route-origin') as mapboxgl.GeoJSONSource).setData(
            originPoint as any,
          );
        } else {
          map.current.addSource('road-route-origin', {
            type: 'geojson',
            data: originPoint,
          });
        }

        if (!map.current.getLayer('road-route-origin')) {
          map.current.addLayer({
            id: 'road-route-origin',
            type: 'circle',
            source: 'road-route-origin',
            paint: {
              'circle-radius': 6,
              'circle-color': '#38bdf8',
              'circle-stroke-width': 2,
              'circle-stroke-color': '#0f172a',
            },
          });
        }

        if (map.current.getSource('road-route-destination')) {
          (map.current.getSource('road-route-destination') as mapboxgl.GeoJSONSource).setData(
            destinationPoint as any,
          );
        } else {
          map.current.addSource('road-route-destination', {
            type: 'geojson',
            data: destinationPoint,
          });
        }

        if (!map.current.getLayer('road-route-destination')) {
          map.current.addLayer({
            id: 'road-route-destination',
            type: 'circle',
            source: 'road-route-destination',
            paint: {
              'circle-radius': 6,
              'circle-color': '#f97316',
              'circle-stroke-width': 2,
              'circle-stroke-color': '#0f172a',
            },
          });
        }

        const bounds = new mapboxgl.LngLatBounds();
        routeFeature.geometry.coordinates.forEach((coord) => {
          bounds.extend(coord as [number, number]);
        });

        // First fit the whole road corridor for context
        map.current.fitBounds(bounds, {
          padding: { top: 80, bottom: 80, left: 80, right: 80 },
          duration: 800,
          maxZoom: 7,
        });

        // Highlight Germany (DE) and France (FR) for Road corridor
        if (map.current.getLayer('country-pol')) {
          map.current.setFilter('country-pol', ['==', 'iso_3166_1', 'DE']);
        }
        if (map.current.getLayer('country-pol-border')) {
          map.current.setFilter('country-pol-border', ['==', 'iso_3166_1', 'DE']);
        }
        if (map.current.getLayer('country-pod')) {
          map.current.setFilter('country-pod', ['==', 'iso_3166_1', 'FR']);
        }
        if (map.current.getLayer('country-pod-border')) {
          map.current.setFilter('country-pod-border', ['==', 'iso_3166_1', 'FR']);
        }

        // Hide existing sea vessel routes/markers so Road view is clean
        vessels.forEach((vessel) => {
          ['historic', 'historic-glow', 'historic-points', 'predicted', 'predicted-glow', 'predicted-points', 'tracking', 'delivery-route', 'pickup-nav', 'pickup-nav-glow', 'delivery-nav', 'delivery-nav-glow'].forEach((suffix) => {
            const layerId = `${suffix}-${vessel.id}`;
            if (map.current?.getLayer(layerId)) {
              map.current.setLayoutProperty(layerId, 'visibility', 'none');
            }
          });
        });
        markersRef.current.forEach((marker) => {
          const element = marker.getElement();
          if (element) element.style.display = 'none';
        });

        // Enable a cinematic 3D view focused on the road corridor
        if (!map.current.getSource('mapbox-dem')) {
          map.current.addSource('mapbox-dem', {
            type: 'raster-dem',
            url: 'mapbox://mapbox.terrain-rgb',
            tileSize: 512,
            maxzoom: 14,
          });
        }
        map.current.setTerrain({ source: 'mapbox-dem', exaggeration: 1.6 });
        add3DBuildingsLayer();
        if (!is3DView) {
          setIs3DView(true);
        }

        // Then zoom in and tilt into a focused 3D view on the road corridor center
        const center = bounds.getCenter();
        map.current.easeTo({
          center: [center.lng, center.lat],
          zoom: 5.5,
          pitch: 60,
          bearing: -25,
          duration: 1600,
          easing: (t) => t * (2 - t),
        });

        // eslint-disable-next-line no-console
        console.log('[ROAD] camera adjusted to road corridor and 3D view applied');
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to render road route', error);
      }
    };

    setupRoadRoute();

    return () => {
      cancelled = true;
    };
  }, [
    isRoadMode,
    mapboxToken,
    isMapReady,
    fetchDirections,
    add3DBuildingsLayer,
  ]);

  const calculateVesselPosition = (vessel: VesselData, customProgress?: number): [number, number] => {
    const combinedTrack = dedupeSequentialCoordinates([
      ...vessel.track.historic.map((point) => point.coordinate),
      ...vessel.track.predicted.map((point) => point.coordinate),
    ]);

    if (combinedTrack.length === 0) {
      return vessel.position;
    }

    if (customProgress === undefined) {
      const latestHistoric = vessel.track.historic[vessel.track.historic.length - 1]?.coordinate;
      if (latestHistoric) {
        return latestHistoric;
      }
    }

    if (combinedTrack.length === 1) {
      return combinedTrack[0];
    }

    const progress = customProgress ?? (vesselProgress[vessel.id] ?? vessel.progress ?? 0);
    const clampedProgress = Math.min(Math.max(progress, 0), 100);
    const trackLine = turf.lineString(combinedTrack);
    const totalDistance = turf.length(trackLine, { units: 'kilometers' });

    if (!totalDistance) {
      return combinedTrack[combinedTrack.length - 1];
    }

    const currentDistance = (clampedProgress / 100) * totalDistance;
    const point = turf.along(trackLine, currentDistance, { units: 'kilometers' });
    return point.geometry.coordinates as [number, number];
  };

  const getLatestHistoricCoordinate = (vessel: VesselData): [number, number] | null => {
    const historicTrack = vessel.track?.historic ?? [];
    if (!historicTrack.length) {
      return null;
    }

    const latest = historicTrack[historicTrack.length - 1]?.coordinate;
    if (!latest) {
      return null;
    }

    return [latest[0], latest[1]];
  };

  function animateMarkerTo(
    marker: mapboxgl.Marker,
    from: [number, number],
    to: [number, number],
    duration: number
  ) {
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic for smoother finish
      const eased = 1 - Math.pow(1 - progress, 3);

      const lng = from[0] + (to[0] - from[0]) * eased;
      const lat = from[1] + (to[1] - from[1]) * eased;

      marker.setLngLat([lng, lat]);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }

  function animateVesselFromOrigin(vessel: VesselData) {
    if (animatingVessel === vessel.id) return;
    if (expandedVessel !== vessel.id) return;

    setAnimatingVessel(vessel.id);
    const marker = vesselMarkersRef.current[vessel.id];
    if (!marker || !map.current) {
      setAnimatingVessel(null);
      return;
    }

    const origin = vessel.route.origin;
    const currentPosition = getLatestHistoricCoordinate(vessel) ?? calculateVesselPosition(vessel);
    const duration = 2000;
    const startTime = Date.now();

    const animate = () => {
      if (expandedVessel !== vessel.id) {
        setAnimatingVessel(null);
        return;
      }

      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const intermediateProgress = progress * (vesselProgress[vessel.id] ?? vessel.progress ?? 0) / 100;
      const intermediatePos = getLatestHistoricCoordinate(vessel) ?? calculateVesselPosition(vessel, intermediateProgress * 100);

      marker.setLngLat(intermediatePos);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        marker.setLngLat(currentPosition);
        setAnimatingVessel(null);
        if (expandedVessel === vessel.id) {
          updateVesselRoutes();
        }
      }
    };

    marker.setLngLat(origin);
    requestAnimationFrame(animate);
  }

  function updateVesselRoutes() {
    // Do not adjust sea routes or camera when in Air or Road modes
    if (isAirMode || isRoadMode) {
      return;
    }

    if (!map.current || !map.current.isStyleLoaded()) {
      if (map.current) {
        map.current.once('style.load', () => {
          setTimeout(() => updateVesselRoutes(), 100);
        });
      }
      return;
    }

    const bounds = new mapboxgl.LngLatBounds();

    const extendBounds = (coord?: [number, number]) => {
      if (!coord) return;
      bounds.extend(coord);
    };

    const extendLineFeature = (feature?: Feature<LineString>) => {
      if (!feature?.geometry?.coordinates?.length) return;
      feature.geometry.coordinates.forEach((coord) => {
        extendBounds(coord as [number, number]);
      });
    };

    const activeRouteType = navigationMode === 'pickup'
      ? 'Origin → Pickup'
      : navigationMode === 'delivery'
        ? 'Destination → Delivery'
        : null;

    const activeRouteFeature = navigationMode === 'pickup'
      ? addressRoutes.pickupToOrigin
      : navigationMode === 'delivery'
        ? addressRoutes.destinationToDelivery
        : null;

    vessels.forEach((vessel) => {
      const { pickup, origin, destination, delivery } = vessel.route;
      const pickupAddressCoordinate = addressLocations.pickup?.coordinate;
      const deliveryAddressCoordinate = addressLocations.delivery?.coordinate;
      const historicRouteCoords = dedupeSequentialCoordinates(
        vessel.track.historic.map((point) => point.coordinate)
      );
      const lastHistoricCoord = historicRouteCoords.length
        ? (historicRouteCoords[historicRouteCoords.length - 1] as [number, number])
        : null;
      const vesselPosition = lastHistoricCoord ?? getLatestHistoricCoordinate(vessel) ?? calculateVesselPosition(vessel);
      const isExpanded = expandedVessel === vessel.id;

      const layerIdsToRemove = [
        `historic-glow-${vessel.id}`,
        `historic-points-${vessel.id}`,
        `historic-${vessel.id}`,
        `predicted-glow-${vessel.id}`,
        `predicted-points-${vessel.id}`,
        `predicted-${vessel.id}`,
        `tracking-${vessel.id}`,
        `full-route-${vessel.id}`,
        `route-line-${vessel.id}`,
        `route-dots-${vessel.id}`,
        `delivery-route-${vessel.id}`,
        `pickup-nav-glow-${vessel.id}`,
        `pickup-nav-${vessel.id}`,
        `delivery-nav-glow-${vessel.id}`,
        `delivery-nav-${vessel.id}`,
      ];

      layerIdsToRemove.forEach((layerId) => {
        if (map.current?.getLayer(layerId)) {
          map.current.removeLayer(layerId);
        }
      });

      const sourceIdsToRemove = [
        `tracking-${vessel.id}`,
        `historic-${vessel.id}`,
        `historic-points-${vessel.id}`,
        `predicted-${vessel.id}`,
        `predicted-points-${vessel.id}`,
        `pickup-nav-${vessel.id}`,
        `delivery-nav-${vessel.id}`,
      ];

      sourceIdsToRemove.forEach((sourceId) => {
        if (map.current?.getSource(sourceId)) {
          map.current.removeSource(sourceId);
        }
      });

      if (routeMarkersRef.current[vessel.id]) {
        routeMarkersRef.current[vessel.id].forEach((marker) => marker.remove());
        routeMarkersRef.current[vessel.id] = [];
      }

      const seaTrackingPoint1: [number, number] = [pickup[0] - 0.5, pickup[1] - 0.3];
      const seaTrackingPoint2: [number, number] = [origin[0] - 0.2, origin[1] - 0.1];
      const trackingRoute = turf.lineString([pickup, seaTrackingPoint1, seaTrackingPoint2, origin]);
      map.current.addSource(`tracking-${vessel.id}`, {
        type: 'geojson',
        data: trackingRoute,
      });

      map.current.addLayer({
        id: `tracking-${vessel.id}`,
        type: 'line',
        source: `tracking-${vessel.id}`,
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
        },
        paint: {
          'line-color': '#94A3B8',
          'line-width': 4,
          'line-dasharray': [0.25, 0.9],
        },
      });

      if (historicRouteCoords.length > 1) {
        map.current.addSource(`historic-${vessel.id}`, {
          type: 'geojson',
          data: turf.lineString(historicRouteCoords),
          'lineMetrics': true, // Enable line gradients
        });

        // Add glow layer for trail effect (emerald green distinct from countries)
        map.current.addLayer({
          id: `historic-glow-${vessel.id}`,
          type: 'line',
          source: `historic-${vessel.id}`,
          paint: {
            'line-color': '#10B981',  // Emerald green glow
            'line-width': [
              'interpolate',
              ['linear'],
              ['zoom'],
              2, 8,
              6, 14,
              10, 20
            ],
            'line-opacity': 0.3,
            'line-blur': 3,
          },
        });

        // Main historic trail with gradient (emerald theme)
        map.current.addLayer({
          id: `historic-${vessel.id}`,
          type: 'line',
          source: `historic-${vessel.id}`,
          paint: {
            'line-color': '#059669',  // Rich emerald
            'line-width': [
              'interpolate',
              ['linear'],
              ['zoom'],
              2, 3,
              6, 5,
              10, 7
            ],
            'line-opacity': 0.9,
            'line-gradient': [
              'interpolate',
              ['linear'],
              ['line-progress'],
              0, 'rgba(16, 185, 129, 0.3)',  // Light emerald start
              0.7, 'rgba(5, 150, 105, 0.7)',  // Mid emerald
              1, 'rgba(16, 185, 129, 1)'  // Bright emerald end
            ]
          },
        });
        
        // Add circle markers at each historic tracking point
        const historicPoints = vessel.track.historic.map((point) => ({
          type: 'Feature' as const,
          geometry: {
            type: 'Point' as const,
            coordinates: point.coordinate
          },
          properties: {
            datetime: point.datetime
          }
        }));
        
        map.current.addSource(`historic-points-${vessel.id}`, {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: historicPoints
          }
        });
        
        // Add circles at each tracking point
        map.current.addLayer({
          id: `historic-points-${vessel.id}`,
          type: 'circle',
          source: `historic-points-${vessel.id}`,
          paint: {
            'circle-radius': [
              'interpolate',
              ['linear'],
              ['zoom'],
              2, 2,
              6, 3,
              10, 4,
              14, 6
            ],
            'circle-color': '#10B981',
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 1,
            'circle-opacity': 0.8,
            'circle-stroke-opacity': 0.9
          }
        });
      }

      // Use actual predicted data points directly with futuristic styling
      const predictedLineCoords = dedupeSequentialCoordinates(
        vessel.track.predicted.map((point) => point.coordinate)
      );
      if (predictedLineCoords.length > 1) {
        console.log('🔮 Predicted line coords count:', predictedLineCoords.length);
        console.log('🔮 Last predicted coord used:', predictedLineCoords[predictedLineCoords.length - 1]);
        map.current.addSource(`predicted-${vessel.id}`, {
          type: 'geojson',
          data: turf.lineString(predictedLineCoords),
          'lineMetrics': true,
        });

        // Add glow for predicted path (orange/amber distinct from countries)
        map.current.addLayer({
          id: `predicted-glow-${vessel.id}`,
          type: 'line',
          source: `predicted-${vessel.id}`,
          paint: {
            'line-color': '#F59E0B',  // Amber glow
            'line-width': [
              'interpolate',
              ['linear'],
              ['zoom'],
              2, 6,
              6, 10,
              10, 14
            ],
            'line-opacity': 0.3,
            'line-blur': 4,
          },
        });

        // Predicted route with animated dashes (amber theme)
        map.current.addLayer({
          id: `predicted-${vessel.id}`,
          type: 'line',
          source: `predicted-${vessel.id}`,
          paint: {
            'line-color': '#D97706',  // Deep amber
            'line-width': [
              'interpolate',
              ['linear'],
              ['zoom'],
              2, 2,
              6, 3,
              10, 5
            ],
            'line-dasharray': [2, 2],
            'line-opacity': 0.85,
          },
        });
        
        // Add circle markers at predicted points
        const predictedPoints = vessel.track.predicted.map((point) => ({
          type: 'Feature' as const,
          geometry: {
            type: 'Point' as const,
            coordinates: point.coordinate
          },
          properties: {
            datetime: point.datetime
          }
        }));
        
        map.current.addSource(`predicted-points-${vessel.id}`, {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: predictedPoints
          }
        });
        
        // Add smaller circles for predicted points
        map.current.addLayer({
          id: `predicted-points-${vessel.id}`,
          type: 'circle',
          source: `predicted-points-${vessel.id}`,
          paint: {
            'circle-radius': [
              'interpolate',
              ['linear'],
              ['zoom'],
              2, 1.5,
              6, 2,
              10, 3,
              14, 4
            ],
            'circle-color': '#F59E0B',
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 0.5,
            'circle-opacity': 0.6,
            'circle-stroke-opacity': 0.7
          }
        });
      }

      const pickupNavigationData = addressRoutes.pickupToOrigin;
      const deliveryNavigationData = addressRoutes.destinationToDelivery;

      if (pickupNavigationData) {
        map.current.addSource(`pickup-nav-${vessel.id}`, {
          type: 'geojson',
          data: pickupNavigationData,
        });

        // Add glow layer for pickup route (slimmer)
        map.current.addLayer({
          id: `pickup-nav-glow-${vessel.id}`,
          type: 'line',
          source: `pickup-nav-${vessel.id}`,
          layout: {
            'line-cap': 'round',
            'line-join': 'round',
            'visibility': 'visible'
          },
          paint: {
            'line-color': '#10B981',
            'line-width': 8,
            'line-opacity': 0.3,
            'line-blur': 4,
          },
        });
        
        map.current.addLayer({
          id: `pickup-nav-${vessel.id}`,
          type: 'line',
          source: `pickup-nav-${vessel.id}`,
          layout: {
            'line-cap': 'round',
            'line-join': 'round',
            'visibility': 'visible'  // Show in overall view
          },
          paint: {
            'line-color': '#10B981',
            'line-width': 3,
            'line-opacity': 0.9,
          },
        });

        // Add click handler for pickup route
        map.current.on('click', `pickup-nav-${vessel.id}`, () => {
          if (navigationMode) return;
          setNavigationMode('pickup');
          switchToStreetView(pickupNavigationData, 'Origin → Pickup');
          
          const distance = turf.length(pickupNavigationData, { units: 'kilometers' });
          const emissions = distance * 0.262;
          const drayageCost = distance * 5.5;
          const travelTime = Math.round((distance / 45) * 60);
          onSegmentDataChange?.({
            distance: distance.toFixed(1),
            emissions: emissions.toFixed(1),
            cost: Math.round(drayageCost),
            travelTime,
          });
          onAddressViewChange?.('supplier');
          
          setTimeout(() => {
            animateTruckAlongRoute(pickupNavigationData, 0, true);
          }, 1000);
        });

        // Change cursor on hover
        map.current.on('mouseenter', `pickup-nav-${vessel.id}`, () => {
          if (map.current) map.current.getCanvas().style.cursor = 'pointer';
        });
        map.current.on('mouseleave', `pickup-nav-${vessel.id}`, () => {
          if (map.current) map.current.getCanvas().style.cursor = '';
        });
      }

      if (deliveryNavigationData) {
        map.current.addSource(`delivery-nav-${vessel.id}`, {
          type: 'geojson',
          data: deliveryNavigationData,
        });

        // Add glow layer for delivery route (slimmer, green)
        map.current.addLayer({
          id: `delivery-nav-glow-${vessel.id}`,
          type: 'line',
          source: `delivery-nav-${vessel.id}`,
          layout: {
            'line-cap': 'round',
            'line-join': 'round',
            'visibility': 'visible'
          },
          paint: {
            'line-color': '#10B981',
            'line-width': 8,
            'line-opacity': 0.3,
            'line-blur': 4,
          },
        });
        
        map.current.addLayer({
          id: `delivery-nav-${vessel.id}`,
          type: 'line',
          source: `delivery-nav-${vessel.id}`,
          layout: {
            'line-cap': 'round',
            'line-join': 'round',
            'visibility': 'visible'  // Show in overall view
          },
          paint: {
            'line-color': '#10B981',
            'line-width': 3,
            'line-opacity': 0.9,
          },
        });

        // Add click handler for delivery route
        map.current.on('click', `delivery-nav-${vessel.id}`, () => {
          if (navigationMode) return;
          setNavigationMode('delivery');
          switchToStreetView(deliveryNavigationData, 'Destination → Delivery');
          
          const distance = turf.length(deliveryNavigationData, { units: 'kilometers' });
          const emissions = distance * 0.262;
          const drayageCost = distance * 5.5;
          const travelTime = Math.round((distance / 45) * 60);
          onSegmentDataChange?.({
            distance: distance.toFixed(1),
            emissions: emissions.toFixed(1),
            cost: Math.round(drayageCost),
            travelTime,
          });
          onAddressViewChange?.('buyer');
          
          setTimeout(() => {
            animateTruckAlongRoute(deliveryNavigationData, 0, false);
          }, 1000);
        });

        // Change cursor on hover
        map.current.on('mouseenter', `delivery-nav-${vessel.id}`, () => {
          if (map.current) map.current.getCanvas().style.cursor = 'pointer';
        });
        map.current.on('mouseleave', `delivery-nav-${vessel.id}`, () => {
          if (map.current) map.current.getCanvas().style.cursor = '';
        });
      }

      routeMarkersRef.current[vessel.id] = [];
      addRoutePointMarker(origin, portIcon, 'origin', vessel.id);
      addRoutePointMarker(destination, portIcon, 'destination', vessel.id);
      if (pickupAddressCoordinate) {
        addRoutePointMarker(pickupAddressCoordinate, addressIcon, 'pickup', vessel.id, true);
      }
      if (deliveryAddressCoordinate) {
        addRoutePointMarker(deliveryAddressCoordinate, addressIcon, 'delivery', vessel.id, true);
      }

      [pickup, origin, vesselPosition, destination, delivery, pickupAddressCoordinate, deliveryAddressCoordinate].forEach((coord) => {
        extendBounds(coord);
      });

      extendLineFeature(trackingRoute as Feature<LineString>);
      extendLineFeature(pickupNavigationData as Feature<LineString> | undefined);
      extendLineFeature(deliveryNavigationData as Feature<LineString> | undefined);
    });

    if (!bounds.isEmpty()) {
      map.current.fitBounds(bounds, {
        padding: { top: 80, bottom: 80, left: 80, right: 360 },
        animate: false,
      });
    }

    if (activeNavigationRouteRef.current) {
      const { feature, type } = activeNavigationRouteRef.current;
      console.log('🔁 Reapplying route focus for', getRouteDescription(type));
      switchToStreetView(feature, getRouteDescription(type));
    }
  }

  function addRoutePointMarker(
    coordinates: [number, number],
    icon: string,
    type: string,
    vesselId: string,
    isAddress: boolean = false
  ) {
    if (!map.current) return;
    
    const size = isAddress ? { width: 25, height: 20 } : { width: 35, height: 37 };
    const el = createMarkerElement(icon, size);
    el.style.backgroundColor = 'transparent';
    el.style.transform = isAddress ? 'translateY(-4px)' : 'translateY(-8px)';
    
    // Add bright glow effect for visibility on dark map
    if (isAddress) {
      el.style.filter = 'brightness(1.8) drop-shadow(0 0 10px rgba(255, 200, 0, 0.8))';
    } else {
      el.style.filter = 'brightness(1.5) drop-shadow(0 0 8px rgba(0, 200, 255, 0.8))';
    }

    if (isAddress) {
      el.addEventListener('click', (event: Event) => {
        event.stopPropagation();
        console.log('🎯 Address marker clicked:', type);
        console.log('🔍 Current navigationMode:', navigationMode);
        handleAddressNavigationToggle(type as AddressNavType);
      });
    }

    const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
      .setLngLat(coordinates)
      .setPitchAlignment('map')
      .setRotationAlignment('map')
      .addTo(map.current);

    if (!routeMarkersRef.current[vesselId]) {
      routeMarkersRef.current[vesselId] = [];
    }
    routeMarkersRef.current[vesselId].push(marker);
  }

  function addVesselMarkers() {
    if (!map.current) return;

    // Enhanced glow effects for SF Ships style
    const glowStyleId = 'vessel-glow-keyframes';
    if (!document.getElementById(glowStyleId)) {
      const style = document.createElement('style');
      style.id = glowStyleId;
      style.textContent = `
        @keyframes vessel-glow {
          0%, 100% { 
            box-shadow: 0 0 20px rgba(16, 185, 129, 0.8), 
                        0 0 40px rgba(16, 185, 129, 0.6),
                        0 0 60px rgba(16, 185, 129, 0.4);
            transform: scale(1);
          }
          50% { 
            box-shadow: 0 0 30px rgba(16, 185, 129, 1), 
                        0 0 60px rgba(16, 185, 129, 0.8),
                        0 0 80px rgba(16, 185, 129, 0.6);
            transform: scale(1.1);
          }
        }
        @keyframes pulse-ring {
          0% {
            transform: scale(0.8);
            opacity: 1;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        /* Dark scrollbars for voyage sidebar */
        .voyage-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .voyage-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .voyage-scroll::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.6); /* slate-400 */
          border-radius: 9999px;
        }
        .voyage-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.9);
        }
        /* Dark theme for vessel performance popup */
        .mapboxgl-popup.vessel-performance-popup {
          max-width: 260px;
          background: transparent !important;
          box-shadow: none !important;
          border: none !important;
        }
        .mapboxgl-popup.vessel-performance-popup .mapboxgl-popup-content {
          padding: 0 !important;
          background: transparent !important;
          border-radius: 0 !important;
          box-shadow: none !important;
          border: none !important;
        }
        .mapboxgl-popup.vessel-performance-popup .mapboxgl-popup-tip {
          display: none;
        }
      `;
      document.head.appendChild(style);
    }

    vessels.forEach((vessel) => {
      const latestHistoric = getLatestHistoricCoordinate(vessel);
      const vesselPosition = latestHistoric ?? calculateVesselPosition(vessel);

      // Create container for vessel with enhanced effects
      const el = document.createElement('div');
      el.style.position = 'relative';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.pointerEvents = 'auto';
      el.style.cursor = 'pointer';

      // Add pulsing ring effect
      const pulseRing = document.createElement('div');
      pulseRing.style.position = 'absolute';
      pulseRing.style.width = '100px';
      pulseRing.style.height = '100px';
      pulseRing.style.border = '2px solid rgba(16, 185, 129, 0.6)';  // Emerald ring
      pulseRing.style.borderRadius = '50%';
      pulseRing.style.animation = 'pulse-ring 2s infinite';
      el.appendChild(pulseRing);

      const iconEl = createMarkerElement(vesselIcon, { width: 72, height: 72 });
      // Apply emerald glow to vessel icon
      iconEl.style.filter = 'brightness(1.5) drop-shadow(0 0 15px rgba(16, 185, 129, 0.8))';
      el.appendChild(iconEl);

      const badge = document.createElement('div');
      badge.textContent = String(vessel.containers.length);
      badge.style.position = 'absolute';
      badge.style.top = '-20px';
      badge.style.left = '50%';
      badge.style.transform = 'translate(-50%, 0)';
      badge.style.width = '28px';
      badge.style.height = '28px';
      badge.style.borderRadius = '9999px';
      badge.style.background = 'rgba(16, 185, 129, 0.95)';  // Emerald background
      badge.style.color = '#fff';
      badge.style.display = 'flex';
      badge.style.alignItems = 'center';
      badge.style.justifyContent = 'center';
      badge.style.fontSize = '14px';
      badge.style.fontWeight = '700';
      badge.style.boxShadow = '0 0 20px rgba(16, 185, 129, 0.9)';
      badge.style.border = '2px solid rgba(255, 255, 255, 0.4)';
      badge.style.animation = 'vessel-glow 1.6s ease-in-out infinite';

      el.appendChild(badge);

      const markerEl = el;
      const marker = new mapboxgl.Marker({ element: markerEl, anchor: 'center' })
        .setLngLat(vesselPosition)
        .setPitchAlignment('map')
        .setRotationAlignment('map')
        .addTo(map.current);

      const popup = new mapboxgl.Popup({
        closeButton: false,
        anchor: 'bottom',
        offset: [0, -60],
        className: 'vessel-performance-popup',
      });

      const performanceHtml = `
        <div class="min-w-[220px] rounded-lg border border-slate-800 bg-slate-950/90 px-3 py-2 shadow-xl backdrop-blur-md">
          <div class="uppercase tracking-[0.16em] text-[10px] text-slate-400 mb-1">Historical analysis</div>
          <div class="text-[11px] text-slate-200 leading-snug">
            <span class="font-semibold text-slate-50">${vessel.name}</span>
            <span class="text-slate-400"> performance snapshot</span>
            <div class="mt-1 text-[10px] text-slate-400">
              Voyages: <span class="text-slate-100 font-semibold">20</span>
            </div>
            <div class="mt-1 flex items-center gap-2 text-[10px]">
              <span class="text-emerald-400 font-semibold">On-time: 50%</span>
              <span class="text-slate-600">|</span>
              <span class="text-amber-300 font-semibold">Delayed: 50%</span>
            </div>
          </div>
        </div>
      `;

      el.addEventListener('mouseenter', () => {
        if (!map.current) return;
        popup.setLngLat(marker.getLngLat()).setHTML(performanceHtml).addTo(map.current);
      });

      el.addEventListener('mouseleave', () => {
        popup.remove();
      });

      el.addEventListener('click', () => {
        setSelectedVessel(vessel);
        const isAlreadyExpanded = expandedVessel === vessel.id;

        // Smooth zoom animation when clicking vessel (only when expanding)
        if (map.current && !isAlreadyExpanded) {
          // Zoom out to show entire tracking with animation
          const bounds = new mapboxgl.LngLatBounds();

          // Add all tracking points to bounds
          vessel.track.historic.forEach((point) => {
            bounds.extend(point.coordinate as [number, number]);
          });
          vessel.track.predicted.forEach((point) => {
            bounds.extend(point.coordinate as [number, number]);
          });

          // Animate to show the entire tracking route
          map.current.fitBounds(bounds, {
            padding: { top: 100, bottom: 100, left: 100, right: 400 },
            duration: 2000,
            maxZoom: 8,
            essential: true,
          });
        }

        // Always mark this vessel as expanded when clicked
        setExpandedVessel(vessel.id);

        // Animate vessel movement from origin to current position when expanding
        if (!isAlreadyExpanded) {
          // Wait for state update and map to be ready, then render routes and animate
          setTimeout(() => {
            if (map.current && map.current.isStyleLoaded()) {
              // Ensure routes are rendered first
              updateVesselRoutes();
              // Then animate after routes are visible
              setTimeout(() => {
                animateVesselFromOrigin(vessel);
              }, 100);
            }
          }, 100);
        }
      });

      vesselMarkersRef.current[vessel.id] = marker;
      markersRef.current.push(marker);
    });
  }

  const handleTokenSubmit = () => {
    if (tokenInput.trim()) {
      setMapboxToken(tokenInput.trim());
      setIsTokenSet(true);
    }
  };

  let demurrageBannerTitle = '';
  let demurrageBannerDescription = '';

  if (demurrageAlertStep === 1) {
    demurrageBannerTitle = 'Plan your delivery';
    demurrageBannerDescription =
      'Please book your container delivery in advance to avoid last-minute issues and delays.';
  } else if (demurrageAlertStep === 2) {
    demurrageBannerTitle = 'Vessel arrived – free days running';
    demurrageBannerDescription =
      'Your vessel has arrived. Use your free days now to book and pick up containers before demurrage starts.';
  } else if (demurrageAlertStep === 3) {
    demurrageBannerTitle = 'Demurrage risk – charges may apply';
    demurrageBannerDescription =
      'Free time has ended for at least one container. Carrier may now charge daily demurrage until it is moved out.';
  }

  return (
    <div className="relative w-full h-screen">
      {!isTokenSet ? (
        <div className="absolute inset-0 flex items-center justify-center bg-background">
          <div className="bg-card border border-border rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
            <div className="mb-6 text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <path d="M12 18v-6"/>
                  <path d="m9 15 3 3 3-3"/>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Mapbox Token Required</h2>
              <p className="text-muted-foreground text-sm">
                Enter your Mapbox public access token to load the map
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Mapbox Access Token
                </label>
                <input
                  type="text"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleTokenSubmit()}
                  placeholder="pk.eyJ1Ijoi..."
                  className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground"
                />
              </div>
              
              <button
                onClick={handleTokenSubmit}
                disabled={!tokenInput.trim()}
                className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Load Map
              </button>
              
              <div className="pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground mb-2">
                  Don't have a token?
                </p>
                <a
                  href="https://account.mapbox.com/access-tokens/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline"
                >
                  Get your free token from Mapbox →
                </a>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div ref={mapContainer} className="absolute inset-0" />
          {/* Map Error Display */}
          {mapError && (
            <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-destructive/10 border border-destructive rounded-lg p-4 z-10 max-w-md w-full mx-4 animate-fade-in">
              <div className="flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-destructive flex-shrink-0 mt-0.5">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-destructive">Map Loading Error</p>
                  <p className="text-xs text-muted-foreground mt-1">{mapError}</p>
                </div>
                <button
                  onClick={() => {
                    setMapError(null);
                    setIsTokenSet(false);
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Demurrage alerts banner */}
          {!isAirMode && !isRoadMode && showDemurrageBanner && demurrageAlertStep > 0 && (
            <div className="absolute top-6 left-6 z-10 max-w-xl w-[calc(100%-3rem)] bg-slate-950/85 border border-amber-500/60 rounded-lg px-4 py-3 shadow-lg flex items-start gap-3 backdrop-blur-md">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-amber-300 mt-0.5 flex-shrink-0"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-50">{demurrageBannerTitle}</p>
                <p className="text-xs text-amber-100/80 mt-1">{demurrageBannerDescription}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowDemurrageBanner(false)}
                className="text-amber-200/80 hover:text-amber-50 transition-colors ml-2 mt-0.5"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          )}

          {/* Minimal Navigation Close Control */}
          {!isAirMode && !isRoadMode && navigationMode && (
            <>
              <button
                onClick={() => {
                  switchToDefaultView();
                  onAddressViewChange?.('default');
                  onSegmentDataChange?.(null);
                }}
                className="absolute top-6 left-6 z-20 bg-white/95 hover:bg-white border border-gray-200 rounded-full shadow-md p-2 flex items-center justify-center transition-colors"
                title="Exit navigation and return to 2D view"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-slate-200"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
              
              {/* Lighting Preset Controls */}
              <div className="absolute top-6 left-20 z-20 flex gap-1 bg-white/95 rounded-lg shadow-md p-1 border border-gray-200">
                {(['dawn', 'day', 'dusk', 'night'] as const).map((preset) => (
                  <button
                    key={preset}
                    onClick={() => {
                      setLightingPreset(preset);
                      if (map.current) {
                        const applyPreset = () => {
                          const presets = {
                            dawn: {
                              fog: {
                                'range': [0.5, 10],
                                'color': 'rgb(255, 194, 158)',
                                'horizon-blend': 0.15,
                                'high-color': '#ff9a56',
                                'space-color': '#402a44',
                                'star-intensity': 0.1
                              },
                              light: {
                                'anchor': 'viewport',
                                'color': '#ffb783',
                                'intensity': 0.7,
                                'position': [1.5, 90, 40]
                              }
                            },
                            day: {
                              fog: {
                                'range': [0.8, 12],
                                'color': 'rgb(220, 235, 245)',
                                'horizon-blend': 0.05,
                                'high-color': '#4A90E2',
                                'space-color': '#000033',
                                'star-intensity': 0
                              },
                              light: {
                                'anchor': 'viewport',
                                'color': 'white',
                                'intensity': 0.5,
                                'position': [1.5, 180, 80]
                              }
                            },
                            dusk: {
                              fog: {
                                'range': [0.4, 9],
                                'color': 'rgb(241, 163, 132)',
                                'horizon-blend': 0.2,
                                'high-color': '#8b4d8b',
                                'space-color': '#1a0033',
                                'star-intensity': 0.3
                              },
                              light: {
                                'anchor': 'viewport',
                                'color': '#ff8c42',
                                'intensity': 0.65,
                                'position': [1.5, 270, 45]
                              }
                            },
                            night: {
                              fog: {
                                'range': [0.3, 8],
                                'color': 'rgb(20, 30, 60)',
                                'horizon-blend': 0.1,
                                'high-color': '#0a1551',
                                'space-color': '#000000',
                                'star-intensity': 0.6
                              },
                              light: {
                                'anchor': 'viewport',
                                'color': '#6B8CFF',
                                'intensity': 0.3,
                                'position': [1.5, 45, 65]
                              }
                            }
                          };
                          const settings = presets[preset];
                          map.current?.setFog(settings.fog as any);
                          map.current?.setLight(settings.light as any);
                        };
                        applyPreset();
                      }
                    }}
                    className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
                      lightingPreset === preset
                        ? preset === 'dawn' ? 'bg-orange-400 text-white' :
                          preset === 'day' ? 'bg-blue-500 text-white' :
                          preset === 'dusk' ? 'bg-purple-500 text-white' :
                          'bg-indigo-900 text-white'
                        : 'bg-white hover:bg-gray-100 text-gray-700'
                    }`}
                    title={`Apply ${preset} lighting`}
                  >
                    {preset === 'dawn' ? '🌅' : 
                     preset === 'day' ? '☀️' : 
                     preset === 'dusk' ? '🌆' : '🌙'} {preset.charAt(0).toUpperCase() + preset.slice(1)}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Voyage time slider (clock control) */}
          {!isAirMode && !isRoadMode && trackTimeSeries.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 bg-slate-950/80 border border-slate-700/60 rounded-xl shadow-lg px-4 py-2 flex items-center gap-3 min-w-[280px] max-w-xl backdrop-blur-md">
              <div className="flex items-center gap-1 text-[11px] text-slate-100 whitespace-nowrap">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-gray-700"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span className="font-medium tracking-tight">
                  {simulationTime
                    ? simulationTime.toISOString().slice(0, 16).replace('T', ' ')
                    : 'Voyage time'}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={trackTimeSeries.length - 1}
                value={simulationIndex}
                onChange={(e) => setSimulationIndex(Number(e.target.value))}
                className="flex-1 h-1 accent-emerald-400 cursor-pointer"
              />
            </div>
          )}
        </>
      )}
      
      {/* Air shipment summary (Air mode from shipments grid) */}
      {isAirMode && activeShipment && (
        <div className="absolute top-6 right-6 bg-slate-950/90 text-slate-100 rounded-xl shadow-xl border border-slate-800 p-4 z-20 w-80 max-h-[48vh] overflow-hidden flex flex-col backdrop-blur-md">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-sky-900/70 flex items-center justify-center border border-sky-500/60">
                <span className="text-sky-300 text-lg">✈</span>
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-50 leading-snug">
                  {airAirline?.name || 'Airline'}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {airFlightInfo?.iata || airFlightInfo?.icao || airFlightInfo?.number || activeShipment.route}
                </p>
              </div>
            </div>
            {airFlight?.flight_status && (
              <span className="rounded-full bg-sky-900/70 border border-sky-500/60 px-2 py-0.5 text-[10px] uppercase tracking-wide text-sky-100 whitespace-nowrap">
                {airFlight.flight_status}
              </span>
            )}
          </div>

          <div className="text-[11px] text-slate-300 space-y-1.5">
            <p className="text-slate-200">
              {airDepartureLabel || 'Origin'} <span className="mx-1">→</span>
              {airArrivalLabel || 'Destination'}
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <div>
                <p className="text-slate-500 uppercase tracking-wide text-[10px] mb-0.5">Departure</p>
                <p>{formatFlightTime(airDeparture?.scheduled ?? null)}</p>
                {airDeparture?.terminal && (
                  <p className="text-slate-500 mt-0.5">Terminal {airDeparture.terminal}</p>
                )}
                {airDeparture?.gate && (
                  <p className="text-slate-500">Gate {airDeparture.gate}</p>
                )}
                {typeof airDeparture?.delay === 'number' && airDeparture.delay > 0 && (
                  <p className="text-amber-400 mt-0.5">Delay {airDeparture.delay} min</p>
                )}
              </div>
              <div>
                <p className="text-slate-500 uppercase tracking-wide text-[10px] mb-0.5">Arrival</p>
                <p>{formatFlightTime(airArrival?.scheduled ?? null)}</p>
                {airArrival?.terminal && (
                  <p className="text-slate-500 mt-0.5">Terminal {airArrival.terminal}</p>
                )}
                {airArrival?.gate && (
                  <p className="text-slate-500">Gate {airArrival.gate}</p>
                )}
                {typeof airArrival?.delay === 'number' && airArrival.delay > 0 && (
                  <p className="text-amber-400 mt-0.5">Delay {airArrival.delay} min</p>
                )}
              </div>
            </div>
            {airFlight?.aircraft && (
              <p className="pt-0.5">
                <span className="text-slate-500 uppercase tracking-wide text-[10px] mr-1">Aircraft</span>
                <span>
                  {airFlight.aircraft.iata || airFlight.aircraft.icao || 'Aircraft'}
                  {airFlight.aircraft.registration ? ` ${airFlight.aircraft.registration}` : ''}
                </span>
              </p>
            )}
          </div>

          <div className="mt-3 border-t border-slate-800/70 pt-2">
            <p className="text-[11px] text-slate-500 uppercase tracking-wide mb-1">Cargo</p>
            <ul className="space-y-0.5 text-[12px] text-slate-200">
              {airCargos.map((cargo) => {
                const isSelected = cargo.id === selectedAirCargoId;
                return (
                  <li key={cargo.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedAirCargoId(cargo.id)}
                      className={`w-full flex items-center gap-2 rounded-lg px-2 py-1 text-left border transition-colors ${
                        isSelected
                          ? 'bg-sky-900/80 border-sky-500/70 text-sky-100'
                          : 'bg-slate-900/60 border-slate-700/70 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate text-[12px]">{cargo.label}</p>
                        {cargo.description && (
                          <p className="text-[11px] text-slate-300 truncate">
                            {cargo.description}
                          </p>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>

            {(() => {
              const selected = airCargos.find((c) => c.id === selectedAirCargoId) ?? airCargos[0];
              if (!selected) return null;
              return (
                <div className="mt-2 rounded-lg border border-slate-800 bg-slate-950/70 px-2.5 py-2 text-[11px] text-slate-200">
                  <p className="font-semibold text-slate-50 mb-0.5">{selected.label}</p>
                  <p className="text-slate-300">
                    {selected.pieces}
                    {selected.weight ? ` • ${selected.weight}` : ''}
                    {selected.volume ? ` • ${selected.volume}` : ''}
                  </p>
                  {selected.description && (
                    <p className="text-slate-400 mt-0.5">{selected.description}</p>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {isRoadMode && activeShipment && (
        <div className="absolute top-6 right-6 bg-slate-950/90 text-slate-100 rounded-xl shadow-xl border border-slate-800 p-4 z-20 w-80 max-h-[48vh] overflow-hidden flex flex-col backdrop-blur-md">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-emerald-900/70 flex items-center justify-center border border-emerald-500/60">
                <span className="text-emerald-300 text-lg">🚚</span>
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-50 leading-snug">
                  Road Freight
                </h3>
                <p className="text-[11px] text-slate-400">
                  {activeShipment.route || 'Germany  France'}
                </p>
              </div>
            </div>
            {activeShipment.status && (
              <span className="rounded-full bg-emerald-900/70 border border-emerald-500/60 px-2 py-0.5 text-[10px] uppercase tracking-wide text-emerald-100 whitespace-nowrap">
                {activeShipment.status}
              </span>
            )}
          </div>

          <div className="text-[11px] text-slate-300 space-y-1.5">
            <p className="text-slate-200">
              {(activeShipment.route?.split('→')[0]?.trim() || 'Germany')} <span className="mx-1"> </span>
              {(activeShipment.route?.split('→')[1]?.trim() || 'France')}
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <div>
                <p className="text-slate-500 uppercase tracking-wide text-[10px] mb-0.5">Departure</p>
                <p>{activeShipment.departure}</p>
              </div>
              <div>
                <p className="text-slate-500 uppercase tracking-wide text-[10px] mb-0.5">Arrival</p>
                <p>{activeShipment.arrival}</p>
              </div>
            </div>
            <p className="pt-0.5">
              <span className="text-slate-500 uppercase tracking-wide text-[10px] mr-1">Shipper</span>
              <span>{activeShipment.tradeParty}</span>
            </p>
            <p className="text-[10px] text-slate-500 mt-1">
              Showing a demo driving route between Germany and France for road shipments.
            </p>
          </div>
        </div>
      )}

      {/* Vessel & voyage sidebar - top-right */}
      {!isAirMode && !isRoadMode && selectedVessel && (
        <div className="absolute top-6 right-6 bg-slate-950/90 text-slate-100 rounded-xl shadow-xl border border-slate-800 p-3 z-20 w-80 max-h-[78vh] overflow-hidden flex flex-col backdrop-blur-md">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="overflow-hidden rounded-lg border border-slate-700/80 bg-slate-900/80 h-12 w-16 flex items-center justify-center">
                <img
                  src={vesselImage}
                  alt={selectedVessel.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-50">{selectedVessel.name}</h3>
                <p className="text-[11px] text-slate-400">
                  {selectedVessel.containers.length} containers • IMO {primaryTrack?.vessel.vessel_imo_number ?? '-'}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedVessel(null);
                setExpandedVessel(null);
              }}
              className="text-slate-400 hover:text-slate-100 transition-colors p-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          
          <div className="space-y-2 overflow-y-auto flex-1 pr-1 voyage-scroll">
            {/* Vessel characteristics from new26.txt */}
            {primaryTrack?.vessel && (
              <div className="border border-slate-800 rounded-lg p-2.5 bg-slate-900/70">
                <div className="text-[11px] font-semibold text-slate-200 mb-1">Vessel characteristics</div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-slate-100">
                  <div>
                    <span className="text-slate-400 uppercase tracking-wide text-[10px]">IMO</span>
                    <br />
                    {primaryTrack.vessel.vessel_imo_number ?? '-'}
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase tracking-wide text-[10px]">MMSI</span>
                    <br />
                    {primaryTrack.vessel.vessel_mmsi_number ?? '-'}
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase tracking-wide text-[10px]">Length</span>
                    <br />
                    {primaryTrack.vessel.vessel_length ? `${primaryTrack.vessel.vessel_length} m` : '-'}
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase tracking-wide text-[10px]">Beam</span>
                    <br />
                    {primaryTrack.vessel.vessel_width ? `${primaryTrack.vessel.vessel_width} m` : '-'}
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase tracking-wide text-[10px]">Call sign</span>
                    <br />
                    {primaryTrack.vessel.vessel_callsign ?? '-'}
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase tracking-wide text-[10px]">Flag</span>
                    <br />
                    {primaryTrack.vessel.vessel_country_code ?? '-'}
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase tracking-wide text-[10px]">Speed</span>
                    <br />
                    {primaryTrack.vessel.vessel_sog ? `${primaryTrack.vessel.vessel_sog} kn` : '-'}
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase tracking-wide text-[10px]">COG</span>
                    <br />
                    {primaryTrack.vessel.vessel_cog ?? '-'}
                  </div>
                </div>
              </div>
            )}

            {/* Port calls from new26.txt */}
            {primaryTrack?.portcalls?.length ? (
              <div className="border border-slate-800 rounded-lg p-2.5 bg-slate-900/70">
                <div className="text-[11px] font-semibold text-slate-300 mb-1">Port calls</div>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 voyage-scroll">
                  {primaryTrack.portcalls.map((pc, idx) => (
                    <div key={`${pc.un_location_code}-${idx}`} className="flex items-start gap-2 text-[11px] text-slate-300">
                      <div className="mt-0.5 h-2 w-2 rounded-full bg-emerald-400" />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between gap-2">
                          <span className="font-semibold truncate">{pc.port_name ?? pc.un_location_code}</span>
                          <span className="text-slate-500 shrink-0">{pc.un_location_code}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {pc.port_country ?? ''}{pc.port_country ? ' • ' : ''}{pc.port_timezone ?? ''}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {pc.eta_datetime && <span>ETA {pc.eta_datetime.slice(0, 10)} </span>}
                          {pc.etd_datetime && <span>• ETD {pc.etd_datetime.slice(0, 10)} </span>}
                          {pc.ata_datetime && <span>• ATA {pc.ata_datetime.slice(0, 10)} </span>}
                          {pc.atd_datetime && <span>• ATD {pc.atd_datetime.slice(0, 10)} </span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Container list (dark style to match map background) */}
            {selectedVessel.containers.map((container) => {
              const deliveryDate = containerDeliveryDates[container.id];
              const isDemurrageContainer = container.id === demurrageContainerId;
              return (
              <button
                key={container.id}
                onClick={() => {
                  onContainerClick?.(container, selectedVessel);
                }}
                className={`w-full p-2 rounded-lg transition-colors text-left border ${
                  isDemurrageContainer
                    ? 'bg-amber-950/70 hover:bg-amber-950/90 border-amber-500/80'
                    : 'bg-slate-900/70 hover:bg-slate-800 border-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded border ${
                    isDemurrageContainer
                      ? 'bg-amber-900/80 border-amber-500/80'
                      : 'bg-slate-800/90 border-slate-700/80'
                  }`}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={isDemurrageContainer ? 'text-amber-300' : 'text-emerald-400'}
                    >
                      <rect x="3" y="7" width="18" height="10" rx="1" ry="1" />
                      <path d="M7 7v10M11 7v10M15 7v10" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`font-semibold text-xs truncate ${
                        isDemurrageContainer ? 'text-amber-100' : 'text-slate-50'
                      }`}
                    >
                      {container.number}
                    </p>
                    <div
                      className={`flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] mt-0.5 ${
                        isDemurrageContainer ? 'text-amber-200/90' : 'text-slate-400'
                      }`}
                    >
                      <span>{container.type}</span>
                      <span>•</span>
                      <span className="truncate">{container.weight}</span>
                      {deliveryDate && (
                        <>
                          <span>•</span>
                          <span className="truncate text-emerald-300">Delivery {deliveryDate}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-1 text-slate-300">
                    <div
                      className="p-1 rounded hover:bg-slate-800 cursor-pointer"
                      title="Book delivery"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Placeholder: set a demo delivery date and show a toast.
                        const demoDate = '2025-01-07';
                        setContainerDeliveryDates((prev) => ({
                          ...prev,
                          [container.id]: demoDate,
                        }));
                        toast({
                          title: 'Delivery booked',
                          description: `Delivery for ${container.number} booked on ${demoDate}.`,
                        });
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="1" y="3" width="15" height="13" rx="2" ry="2" />
                        <path d="M16 8h3l3 3v5h-6z" />
                        <circle cx="5.5" cy="18.5" r="1.5" />
                        <circle cx="18.5" cy="18.5" r="1.5" />
                      </svg>
                    </div>
                    <div
                      className="p-1 rounded hover:bg-slate-800 cursor-pointer text-amber-300"
                      title="Set alert 7 days before arrival"
                      onClick={(e) => {
                        e.stopPropagation();
                        const nextStep = ((demurrageAlertStep ?? 0) % 3) + 1;
                        setDemurrageAlertStep(nextStep);
                        setShowDemurrageBanner(true);

                        if (nextStep === 1) {
                          setDemurrageContainerId(null);
                        } else if (nextStep === 2) {
                          setDemurrageContainerId(null);
                        } else {
                          setDemurrageContainerId(container.id);
                        }
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                      </svg>
                    </div>
                  </div>
                </div>
              </button>
            );
            })}
          </div>
        </div>
      )}

    </div>
  );
};

export default VesselMap;
