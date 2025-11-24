import React from 'react';
import addressRaw from '@/data/vessel-finder/address.txt?raw';
import airRaw from '@/data/vessel-finder/air.txt?raw';
import type { LucideIcon } from 'lucide-react';
import {
  Anchor,
  CalendarDays,
  ChevronDown,
  MapPin,
  Package,
  Ship,
  Plane,
  X,
} from 'lucide-react';

type MilestoneStatus = 'completed' | 'scheduled' | 'delayed' | 'pending';

interface ProgressMilestone {
  id: string;
  label: string;
  location: string;
  statusLabel: string;
  status: MilestoneStatus;
  date: string;
}

interface SectionBase {
  id: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  iconBackground: string;
  iconColor: string;
  details?: string[];
}

interface InfoSection extends SectionBase {
  type: 'info';
}

interface ProgressSection extends SectionBase {
  type: 'progress';
  progress: number;
  milestones: ProgressMilestone[];
}

type Section = InfoSection | ProgressSection;

interface SegmentData {
  distance: string;
  emissions: string;
  cost: number;
  travelTime: number;
}

interface ShipmentSidebarProps {
  mode?: 'default' | 'supplier' | 'buyer';
  onModeChange?: (mode: 'default' | 'supplier' | 'buyer') => void;
  segmentData?: SegmentData | null;
  voyageSummary?: {
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
      status: MilestoneStatus;
      date: string;
    }[];
    transitDays: number;
    transitDaysRemaining: number;
  } | null;
  isAirMode?: boolean;
}

interface ParsedAddress {
  title: string;
  data: Record<string, string>;
}

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

const parsedAddresses = parseAddressFile(addressRaw ?? '');

interface AirApiResponse {
  data?: {
    flight_date?: string;
    flight_status?: string;
    departure?: {
      airport?: string;
      iata?: string;
      scheduled?: string;
      estimated?: string | null;
      actual?: string | null;
      estimated_runway?: string | null;
    };
    arrival?: {
      airport?: string;
      iata?: string;
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
  }[];
}

const parsedAir: AirApiResponse = airRaw ? JSON.parse(airRaw) : {};
const activeFlight = parsedAir.data?.[0];

const statusStyles: Record<
  MilestoneStatus,
  { text: string; dot: string; ring: string; badge: string }
> = {
  completed: {
    text: 'text-emerald-600',
    dot: 'bg-emerald-500',
    ring: 'ring-emerald-100',
    badge: 'bg-emerald-50 text-emerald-600',
  },
  scheduled: {
    text: 'text-blue-600',
    dot: 'bg-blue-500',
    ring: 'ring-blue-100',
    badge: 'bg-blue-50 text-blue-600',
  },
  delayed: {
    text: 'text-amber-600',
    dot: 'bg-amber-500',
    ring: 'ring-amber-100',
    badge: 'bg-amber-50 text-amber-700',
  },
  pending: {
    text: 'text-slate-500',
    dot: 'bg-slate-400',
    ring: 'ring-slate-200',
    badge: 'bg-slate-100 text-slate-600',
  },
};

const ShipmentSidebar: React.FC<ShipmentSidebarProps> = ({ mode = 'default', onModeChange, segmentData, voyageSummary, isAirMode }) => {
  const isAirView = isAirMode === true;
  const isSupplierView = !isAirView && mode === 'supplier';
  const isBuyerView = !isAirView && mode === 'buyer';
  const showCloseAction = !isAirView && (isSupplierView || isBuyerView);

  const airDeparture = activeFlight?.departure;
  const airArrival = activeFlight?.arrival;
  const airAirline = activeFlight?.airline;
  const airFlightInfo = activeFlight?.flight;
  const airDepartureLabel =
    airDeparture?.iata
      ? `${airDeparture.airport ?? ''} (${airDeparture.iata})`
      : airDeparture?.airport;
  const airArrivalLabel =
    airArrival?.iata
      ? `${airArrival.airport ?? ''} (${airArrival.iata})`
      : airArrival?.airport;

  const handleClose = () => {
    onModeChange?.('default');
  };

  const defaultSummary = {
    status: 'Shipment in Transit',
    location: 'Singapore',
    vesselName: 'MV Horizon Star',
    etaDate: '28/09/2025',
    etaTime: '06:00',
    lastPort: 'Departed Hong Kong • 18/08/2025',
    nextPort: 'Arriving Singapore • 28/09/2025',
    cargo: '1,200 cartons • 3 containers',
    timelinessStatus: 'unknown' as const,
    timelinessLabel: 'On schedule',
    voyageMilestones: [
      {
        id: 'departure',
        label: 'Departure',
        location: 'QINGDAO PT',
        statusLabel: 'Completed',
        status: 'completed',
        date: '21/10/2025',
      },
      {
        id: 'transit',
        label: 'Transshipment',
        location: 'Tanjung Pelepas',
        statusLabel: 'Completed',
        status: 'completed',
        date: '31/10/2025',
      },
      {
        id: 'arrival',
        label: 'Final Arrival',
        location: 'LONDON GATEWAY PORT',
        statusLabel: 'On Schedule',
        status: 'scheduled',
        date: '29/11/2025',
      },
    ],
    transitDays: 0,
    transitDaysRemaining: 0,
  };

  const summary = voyageSummary ?? defaultSummary;

  const formatIsoDateTime = (iso?: string | null) => {
    if (!iso) return '-';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '-';
    const day = d.getUTCDate().toString().padStart(2, '0');
    const month = (d.getUTCMonth() + 1).toString().padStart(2, '0');
    const year = d.getUTCFullYear();
    const hours = d.getUTCHours().toString().padStart(2, '0');
    const mins = d.getUTCMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${mins} UTC`;
  };

  const computeLegProgress = (startIso?: string | null, endIso?: string | null) => {
    if (!startIso || !endIso) return 0;
    const start = new Date(startIso);
    const end = new Date(endIso);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end) return 0;

    const now = new Date();
    const total = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    if (elapsed <= 0) return 0;
    if (elapsed >= total) return 100;
    return Math.max(0, Math.min(100, Math.round((elapsed / total) * 100)));
  };

  const airMilestones: ProgressMilestone[] = isAirView && activeFlight
    ? (() => {
        const dep = airDeparture;
        const arr = airArrival;

        const collectedDate = dep?.scheduled ?? dep?.estimated ?? dep?.actual ?? null;
        const departureDate = dep?.actual ?? dep?.estimated_runway ?? dep?.scheduled ?? null;
        const arrivalDate = arr?.actual ?? arr?.estimated ?? arr?.scheduled ?? null;
        const deliveryDate = arrivalDate;

        const hasDepartureActual = !!dep?.actual;
        const hasArrivalActual = !!arr?.actual;

        return [
          {
            id: 'air-collected',
            label: 'Collected',
            location:
              airDepartureLabel ||
              dep?.airport ||
              (dep?.iata ? `${dep.iata} Airport` : 'Origin'),
            statusLabel: 'Completed',
            status: 'completed',
            date: formatIsoDateTime(collectedDate),
          },
          {
            id: 'air-departure',
            label: 'Departure',
            location:
              airDepartureLabel ||
              dep?.airport ||
              (dep?.iata ? `${dep.iata} Airport` : 'Origin'),
            statusLabel: hasDepartureActual ? 'Departed' : 'Scheduled',
            status: hasDepartureActual ? 'completed' : 'scheduled',
            date: formatIsoDateTime(departureDate),
          },
          {
            id: 'air-arrival',
            label: 'Arrival',
            location:
              airArrivalLabel ||
              arr?.airport ||
              (arr?.iata ? `${arr.iata} Airport` : 'Destination'),
            statusLabel: hasArrivalActual ? 'Arrived' : 'Scheduled',
            status: hasArrivalActual ? 'completed' : 'scheduled',
            date: formatIsoDateTime(arrivalDate),
          },
          {
            id: 'air-delivery',
            label: 'Delivery',
            location:
              arr?.airport ||
              (arr?.iata ? `${arr.iata} Airport` : 'Final consignee'),
            statusLabel: 'Pending',
            status: 'pending',
            date: formatIsoDateTime(deliveryDate),
          },
        ];
      })()
    : [];

  const airLegProgress = isAirView
    ? computeLegProgress(airDeparture?.scheduled ?? null, airArrival?.scheduled ?? null)
    : 0;

  const timelinessBadgeClass =
    summary.timelinessStatus === 'delayed'
      ? 'bg-amber-400/25 text-amber-100 border border-amber-300/60'
      : summary.timelinessStatus === 'on-time'
        ? 'bg-emerald-400/25 text-emerald-100 border border-emerald-300/60'
        : 'bg-white/15 text-white/80 border border-white/20';

  const supplierAddress = parsedAddresses.pickup?.data ?? {};
  const buyerAddress = parsedAddresses.delivery?.data ?? {};

  const supplier = {
    name: supplierAddress.CompanyName || 'Supplier',
    address: [
      supplierAddress.AddressLine1,
      supplierAddress.AddressLine2,
      [
        supplierAddress.AddressCity,
        supplierAddress.AddressState,
        supplierAddress.AddressPostCode,
      ]
        .filter(Boolean)
        .join(', '),
      supplierAddress.AddressCountryName,
    ].filter(Boolean),
    nextAction: 'Pickup confirmed',
    etaDate: '07/01/2025',
    etaTime: '09:30',
  };

  const buyer = {
    name: buyerAddress.CompanyName || 'Buyer',
    address: [
      buyerAddress.AddressLine1,
      buyerAddress.AddressLine2,
      [
        buyerAddress.AddressCity,
        buyerAddress.AddressState,
        buyerAddress.AddressPostCode,
      ]
        .filter(Boolean)
        .join(', '),
      buyerAddress.AddressCountryName,
    ].filter(Boolean),
    nextAction: 'Delivery handover scheduled',
    handoverDate: '07/01/2025',
    handoverTime: '13:00',
  };

  const cargoSummary = {
    orderName: 'PO-4508',
    description: 'Children book assortment • 1,200 cartons',
    weight: '26,500 kg',
    volume: '68.4 CBM',
  };

  const oceanLegMilestones: ProgressMilestone[] = summary.voyageMilestones.map((m) => ({
    id: m.id,
    label: m.label,
    location: m.location,
    statusLabel: m.statusLabel,
    status: m.status,
    date: m.date,
  }));

  const completedOceanLeg = oceanLegMilestones.filter((m) => m.status === 'completed').length;
  const oceanLegProgress =
    oceanLegMilestones.length > 0
      ? Math.round((completedOceanLeg / oceanLegMilestones.length) * 100)
      : 0;

  const transitCompletedDays =
    summary.transitDays > 0
      ? Math.max(0, summary.transitDays - summary.transitDaysRemaining)
      : 0;

  const transitProgressPct =
    summary.transitDays > 0
      ? Math.min(
          100,
          Math.max(0, Math.round((transitCompletedDays / summary.transitDays) * 100))
        )
      : 0;

  const buyerTimeline: ProgressMilestone[] = [
    {
      id: 'arrival-port',
      label: 'Arrival at Port',
      location: 'London Gateway',
      statusLabel: 'Complete',
      status: 'completed',
      date: '05/01/2025',
    },
    {
      id: 'customs',
      label: 'Customs Cleared',
      location: 'Tilbury, UK',
      statusLabel: 'Complete',
      status: 'completed',
      date: '06/01/2025',
    },
    {
      id: 'last-mile',
      label: 'Last Mile In Transit',
      location: 'UK Road Carrier',
      statusLabel: 'In Progress',
      status: 'scheduled',
      date: '07/01/2025',
    },
    {
      id: 'delivery',
      label: 'Delivery',
      location: 'Glasgow DC',
      statusLabel: 'Pending',
      status: 'pending',
      date: '07/01/2025',
    },
  ];

  const supplierTimeline: ProgressMilestone[] = [
    {
      id: 'order-accepted',
      label: 'Order Accepted',
      location: 'Supplier Portal',
      statusLabel: 'Complete',
      status: 'completed',
      date: '12/12/2024',
    },
    {
      id: 'cargo-ready',
      label: 'Cargo Ready',
      location: 'Shenzhen Facility',
      statusLabel: 'Complete',
      status: 'completed',
      date: '17/12/2024',
    },
    {
      id: 'quality-check',
      label: 'Quality Check',
      location: 'Shenzhen Facility',
      statusLabel: 'Complete',
      status: 'completed',
      date: '18/12/2024',
    },
    {
      id: 'pickup',
      label: 'Pickup',
      location: 'Supplier Warehouse',
      statusLabel: 'Complete',
      status: 'completed',
      date: '21/12/2024',
    },
    {
      id: 'departure',
      label: 'Departure',
      location: 'Port of Qingdao',
      statusLabel: 'Complete',
      status: 'completed',
      date: '23/12/2024',
    },
    {
      id: 'arrival',
      label: 'Arrival',
      location: 'London Gateway',
      statusLabel: 'On Schedule',
      status: 'scheduled',
      date: '05/01/2025',
    },
    {
      id: 'delivery',
      label: 'Delivery',
      location: 'Glasgow DC',
      statusLabel: 'Pending',
      status: 'pending',
      date: '07/01/2025',
    },
  ];

  const defaultSections: Section[] = [
    {
      id: 'collected',
      type: 'info',
      title: 'Collected',
      subtitle: 'Duantang Town, CN',
      details: [
        'Carrier confirmed and documentation verified',
        'Export customs clearance completed',
      ],
      icon: Package,
      iconBackground: 'bg-[#E9E5FF]',
      iconColor: 'text-[#3725A7]',
    },
    {
      id: 'ocean-leg',
      type: 'progress',
      title: 'Ocean Leg',
      subtitle: 'Main sea voyage',
      progress: oceanLegProgress,
      milestones: oceanLegMilestones,
      icon: Ship,
      iconBackground: 'bg-[#E7F3FF]',
      iconColor: 'text-[#1E3A8A]',
    },
    {
      id: 'transshipment',
      type: 'info',
      title: 'Transshipment',
      subtitle: 'Singapore → London Gateway',
      details: [
        'Window confirmed for 02/09/2025',
        'Liner schedule updated with no delays',
      ],
      icon: Anchor,
      iconBackground: 'bg-[#F4E8FF]',
      iconColor: 'text-[#7C3AED]',
    },
    {
      id: 'planned-delivery',
      type: 'info',
      title: 'Planned Delivery',
      subtitle: 'Colchester, Essex, GB',
      details: [
        'Consignee: Green Sheep Group',
        'Last mile carrier allocated • GXO Logistics',
      ],
      icon: MapPin,
      iconBackground: 'bg-[#FFF4E5]',
      iconColor: 'text-[#C2410C]',
    },
  ];

  const supplierSections: Section[] = [
    {
      id: 'cargo',
      type: 'info',
      title: 'Cargo Summary',
      subtitle: cargoSummary.orderName,
      details: [
        `Description: ${cargoSummary.description}`,
        `Weight: ${cargoSummary.weight}`,
        `Volume: ${cargoSummary.volume}`,
      ],
      icon: Package,
      iconBackground: 'bg-[#E9E5FF]',
      iconColor: 'text-[#3725A7]',
    },
    {
      id: 'delivery-window',
      type: 'info',
      title: 'Delivery Window',
      subtitle: 'Glasgow, United Kingdom',
      details: [
        'Consignee: Buyer',
        'Last mile carrier booked • DX Logistics',
      ],
      icon: MapPin,
      iconBackground: 'bg-[#FFF4E5]',
      iconColor: 'text-[#C2410C]',
    },
    {
      id: 'timeline',
      type: 'progress',
      title: 'Shipment Timeline',
      subtitle: 'Order to delivery progression',
      progress: 72,
      milestones: supplierTimeline,
      icon: Ship,
      iconBackground: 'bg-[#E7F3FF]',
      iconColor: 'text-[#1E3A8A]',
    },
  ];

  const buyerSections: Section[] = [
    {
      id: 'buyer-contact',
      type: 'info',
      title: 'Buyer Details',
      subtitle: buyer.name,
      details: [
        ...buyer.address,
        'Contact: Receiving Supervisor • +44 141 123 4567',
      ],
      icon: MapPin,
      iconBackground: 'bg-[#E5F3FF]',
      iconColor: 'text-[#2563EB]',
    },
    {
      id: 'handover',
      type: 'info',
      title: 'Delivery Appointment',
      subtitle: `${buyer.handoverDate} • ${buyer.handoverTime}`,
      details: [
        'Carrier: DX Logistics',
        'Dock allocation confirmed • Bay 7',
      ],
      icon: Anchor,
      iconBackground: 'bg-[#F0F5FF]',
      iconColor: 'text-[#312E81]',
    },
    {
      id: 'buyer-timeline',
      type: 'progress',
      title: 'Final Mile Timeline',
      subtitle: 'Port arrival to customer handover',
      progress: 54,
      milestones: buyerTimeline,
      icon: Ship,
      iconBackground: 'bg-[#EEF2FF]',
      iconColor: 'text-[#3730A3]',
    },
  ];

  const airSections: Section[] = isAirView
    ? [
        {
          id: 'air-leg',
          type: 'progress',
          title: 'Air Leg',
          subtitle:
            airDeparture?.iata && airArrival?.iata
              ? `${airDeparture.iata} → ${airArrival.iata}`
              : 'Main flight segment',
          progress: airLegProgress,
          milestones: airMilestones,
          icon: Plane,
          iconBackground: 'bg-[#E0F2FE]',
          iconColor: 'text-[#0369A1]',
        },
      ]
    : [];

  const sections = isAirView
    ? airSections
    : isSupplierView
      ? supplierSections
      : isBuyerView
        ? buyerSections
        : defaultSections;

  return (
    <div className="w-[32rem] h-screen overflow-y-auto border-r border-border bg-white">
      <div className="flex min-h-full flex-col gap-6 p-6">
        <div className="relative bg-gradient-to-br from-[#150A66] to-[#4432C9] p-6 text-white shadow-xl">
          {showCloseAction && (
            <button
              type="button"
              onClick={handleClose}
              className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {isAirView ? (
            <div className="flex flex-col gap-4 pr-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-white/70">Air Shipment</p>
                <h2 className="mt-1 text-2xl font-semibold leading-tight">{airAirline?.name || 'Airline'}</h2>
                <p className="mt-1 text-sm text-white/80">
                  {airFlightInfo?.iata || airFlightInfo?.icao || airFlightInfo?.number || 'Flight'}
                </p>
              </div>
              <div className="grid gap-1 text-sm text-white/80">
                {(airDepartureLabel || airArrivalLabel) && (
                  <p>
                    {airDepartureLabel || 'Origin'} 
                    <span className="mx-1">→</span>
                    {airArrivalLabel || 'Destination'}
                  </p>
                )}
                <p>
                  Departure: {formatIsoDateTime(airDeparture?.scheduled)}
                </p>
                <p>
                  Arrival: {formatIsoDateTime(airArrival?.scheduled)}
                </p>
                {activeFlight?.flight_status && (
                  <p>Status: {activeFlight.flight_status}</p>
                )}
              </div>
            </div>
          ) : isSupplierView ? (
            <div className="flex flex-col gap-3 pr-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-white/70">Supplier</p>
                <h2 className="mt-1 text-2xl font-semibold leading-tight">{supplier.name}</h2>
                <div className="mt-3 space-y-1 text-sm text-white/80">
                  {supplier.address.map((line, index) => (
                    <p key={index}>{line}</p>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl bg-white/10 p-3 text-sm text-white/85">
                <p className="font-medium text-white">{supplier.nextAction}</p>
                <p className="mt-1 text-white/75">
                  Estimated Delivery{' '}
                  <span className="font-semibold text-white">{supplier.etaDate}</span> at {supplier.etaTime}
                </p>
              </div>
            </div>
          ) : isBuyerView ? (
            <div className="flex flex-col gap-3 pr-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-white/70">Buyer</p>
                <h2 className="mt-1 text-2xl font-semibold leading-tight">{buyer.name}</h2>
                <div className="mt-3 space-y-1 text-sm text-white/80">
                  {buyer.address.map((line, index) => (
                    <p key={index}>{line}</p>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl bg-white/10 p-3 text-sm text-white/85">
                <p className="font-medium text-white">{buyer.nextAction}</p>
                <p className="mt-1 text-white/75">
                  Appointment{' '}
                  <span className="font-semibold text-white">{buyer.handoverDate}</span> at {buyer.handoverTime}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs uppercase tracking-wider text-white/70">{summary.status}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${timelinessBadgeClass}`}>
                      {summary.timelinessLabel}
                    </span>
                  </div>
                  <h2 className="mt-1 text-3xl font-semibold leading-tight">{summary.location}</h2>
                </div>
              </div>
              <div className="grid gap-2 text-sm text-white/80">
                <p>{summary.lastPort}</p>
                <p>{summary.nextPort}</p>
                {summary.transitDays > 0 && (
                  <div className="mt-1 space-y-1">
                    <div className="flex items-center justify-between text-[11px] uppercase tracking-wide text-white/60">
                      <span>Transit time</span>
                      <span>
                        {transitCompletedDays}d / {summary.transitDays}d
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden bg-white/10 rounded-full">
                      <div
                        className="h-full rounded-full bg-emerald-400 transition-all duration-700"
                        style={{ width: `${transitProgressPct}%` }}
                      />
                    </div>
                    {summary.transitDaysRemaining > 0 && (
                      <p className="text-[11px] text-white/75">
                        {summary.transitDaysRemaining} days remaining
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Segment Analysis Section */}
        {(isSupplierView || isBuyerView) && segmentData && (
          <div className="rounded-3xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50 to-white p-5">
            <h3 className="text-sm font-semibold text-emerald-900 mb-4 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {isSupplierView ? 'Pickup → Origin Port' : 'Destination Port → Delivery'}
            </h3>
            
            {/* Metrics Grid (drayage cost and carbon offset removed for both buyer and supplier views) */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-white rounded-xl p-3 border border-blue-100">
                <p className="text-xs text-blue-600 font-medium mb-1">Distance</p>
                <p className="text-2xl font-bold text-blue-700">{segmentData.distance}</p>
                <p className="text-xs text-blue-500">kilometers</p>
              </div>
              <div className="bg-white rounded-xl p-3 border border-amber-100">
                <p className="text-xs text-amber-600 font-medium mb-1">Travel Time</p>
                <p className="text-2xl font-bold text-amber-700">
                  {Math.floor(segmentData.travelTime / 60)}h {segmentData.travelTime % 60}m
                </p>
                <p className="text-xs text-amber-500">estimated</p>
              </div>
              <div className="bg-white rounded-xl p-3 border border-green-100">
                <p className="text-xs text-green-600 font-medium mb-1">CO₂</p>
                <p className="text-2xl font-bold text-green-700">{segmentData.emissions}</p>
                <p className="text-xs text-green-500">kg emissions</p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {sections.map((section) => {
            const IconComponent = section.icon;

            if (section.type === 'progress') {
              return (
                <div
                  key={section.id}
                  className="rounded-3xl border border-slate-200/70 bg-white p-5"
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${section.iconBackground}`}>
                      <IconComponent className={`h-5 w-5 ${section.iconColor}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{section.title}</p>
                          <p className="text-sm text-muted-foreground">{section.subtitle}</p>
                        </div>
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      </div>

                      <div className="mt-4 space-y-4">
                        <div>
                          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                            <span>Progress to Market</span>
                            <span className="font-semibold text-foreground">{section.progress}%</span>
                          </div>
                          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-muted/60">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-[#6AD35F] to-[#3EBB4C]"
                              style={{ width: `${section.progress}%` }}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          {section.milestones.map((milestone) => {
                            const styles = statusStyles[milestone.status];
                            return (
                              <div
                                key={milestone.id}
                                className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/70 bg-white/80 px-4 py-2.5"
                              >
                                <div className="flex flex-1 items-center gap-3">
                                  <span
                                    className={`h-2.5 w-2.5 rounded-full ${styles.dot} ring-4 ${styles.ring} ring-offset-2 ring-offset-white`}
                                  />
                                  <div>
                                    <p className="text-[13px] font-semibold text-foreground">{milestone.label}</p>
                                    <p className="text-[11px] text-muted-foreground">{milestone.location}</p>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-1 text-right text-[11px]">
                                  <span className={`rounded-full px-2 py-0.5 font-medium leading-none ${styles.badge}`}>
                                    {milestone.statusLabel}
                                  </span>
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <CalendarDays className="h-3 w-3" />
                                    <span>{milestone.date}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div key={section.id} className="rounded-3xl border border-slate-200/70 bg-white p-5">
                <div className="flex items-start gap-3">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${section.iconBackground}`}>
                    <IconComponent className={`h-5 w-5 ${section.iconColor}`} />
                  </div>
                  <div className="flex-1 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{section.title}</p>
                        <p className="text-sm text-muted-foreground">{section.subtitle}</p>
                      </div>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </div>
                    {section.details && (
                      <ul className="space-y-1.5 text-[12px] leading-relaxed text-muted-foreground">
                        {section.details.map((detail, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-muted-foreground/70" />
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ShipmentSidebar;
