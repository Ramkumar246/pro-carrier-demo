import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, FileText, MapPin, Package, Ruler, Ship, Weight } from 'lucide-react';
import equipmentRaw from '@/data/vessel-finder/equipment.txt?raw';
import { Container3D } from './Container3D';
import LoadConfigCard from './loadcardconfig';

interface Container {
  id: string;
  number: string;
  type: string;
  weight: string;
}

interface ContainerDetailsProps {
  container: Container | null;
  vesselName?: string;
  onClose: () => void;
}

interface EquipmentLocation {
  locode: string;
  location_name: string | null;
  country: string | null;
  timezone: string | null;
}

interface EquipmentVessel {
  vessel_imo_number: number | null;
  vessel_name: string | null;
}

interface EquipmentTransportCall {
  un_location_code: string;
  mode_of_transport: string;
  transport_call_type: string;
  location: EquipmentLocation;
  vessel: EquipmentVessel;
}

interface EquipmentEvent {
  event_id: string;
  event_type: string;
  event_classifier_code: string;
  event_datetime: string;
  event_datetime_locale: string;
  transport_event_type_code: string | null;
  equipment_event_type_code: string | null;
  leg_type: string | null;
  transport_call: EquipmentTransportCall;
}

interface EquipmentTimeline {
  identifier: string;
  transport_status: string;
  events: EquipmentEvent[];
}

const parsedEquipment: EquipmentTimeline | null = (() => {
  try {
    return JSON.parse(equipmentRaw) as EquipmentTimeline;
  } catch {
    return null;
  }
})();

const formatVesselName = (name: string | null | undefined): string => {
  if (!name) return '';
  if (name === 'MORTEN MAERSK') return 'maersk';
  return name;
};

const ContainerDetails: React.FC<ContainerDetailsProps> = ({ container, vesselName, onClose }) => {
  if (!container) return null;

  const equipment =
    parsedEquipment && container.number === parsedEquipment.identifier
      ? parsedEquipment
      : null;

  const { milestones, currentStatus } = useMemo(() => {
    if (!equipment) {
      return {
        currentStatus: 'In Transit',
        milestones: [
          { title: 'Container Loaded', date: 'Dec 18, 2024', completed: true },
          { title: 'Vessel Departed', date: 'Dec 18, 2024', completed: true },
          { title: 'In Transit', date: 'Dec 20, 2024', completed: true },
          { title: 'Arrival at Port', date: 'Jan 05, 2025', completed: false },
          { title: 'Ready for Pickup', date: 'Jan 07, 2025', completed: false },
        ],
      };
    }

    const events = [...equipment.events].sort((a, b) =>
      a.event_datetime.localeCompare(b.event_datetime)
    );

    const formatDate = (iso: string) => {
      if (!iso) return '';
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return iso;
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      });
    };

    const describeEvent = (event: EquipmentEvent): string => {
      const locName = event.transport_call.location.location_name || event.transport_call.un_location_code;
      const rawVesselName = event.transport_call.vessel.vessel_name;
      const vesselName = formatVesselName(rawVesselName);
      const legType = event.leg_type;

      if (event.equipment_event_type_code === 'GTOT') {
        return `Gate-out from depot • ${locName}`;
      }
      if (event.equipment_event_type_code === 'GTIN') {
        return `Gate-in full • ${locName}`;
      }
      if (event.equipment_event_type_code === 'LOAD') {
        return `Loaded on ${vesselName || 'vessel'} • ${locName}`;
      }

      if (event.transport_event_type_code === 'ARRI') {
        if (legType === 'PRE_OCEAN') return `Arrived at port of loading • ${locName}`;
        if (event.transport_call.transport_call_type === 'INTERMEDIATE_PORT')
          return `Arrived at transshipment port • ${locName}`;
        return `Arrived • ${locName}`;
      }
      if (event.transport_event_type_code === 'DEPA') {
        if (legType === 'PRE_SHIPMENT') return `Departed depot • ${locName}`;
        if (event.transport_call.transport_call_type === 'PORT_OF_LOADING')
          return `Vessel departed port of loading • ${locName}`;
        if (event.transport_call.transport_call_type === 'INTERMEDIATE_PORT')
          return `Vessel departed transshipment port • ${locName}`;
        return `Departed • ${locName}`;
      }

      return `Event at ${locName}`;
    };

    const milestones = events.map((event) => ({
      title: describeEvent(event),
      date: formatDate(event.event_datetime),
      completed: true,
    }));

    const lastEvent = events[events.length - 1];
    let currentStatus = 'In Transit';
    if (lastEvent) {
      const locName =
        lastEvent.transport_call.location.location_name ||
        lastEvent.transport_call.un_location_code;
      if (lastEvent.transport_event_type_code === 'ARRI') {
        currentStatus = `Arrived • ${locName}`;
      } else if (lastEvent.equipment_event_type_code === 'LOAD') {
        const vesselDisplay = formatVesselName(lastEvent.transport_call.vessel.vessel_name);
        currentStatus = vesselDisplay ? `On vessel ${vesselDisplay}` : 'On vessel';
      } else {
        currentStatus = describeEvent(lastEvent);
      }
    }

    return { milestones, currentStatus };
  }, [equipment, container.number]);

  const getContainerCapacityM3 = (type: string) => {
    const normalized = type.toLowerCase();
    if (normalized.includes('20')) return 33.2; // approximate internal volume for 20ft
    if (normalized.includes('40')) return 67.7; // as specified for 40ft
    return 50;
  };

  const getPlannedUtilization = (c: Container) => {
    switch (c.id) {
      case 'container-abn-1':
        return 76; // primary 40ft container
      case 'container-abn-2':
        return 25; // 20ft container
      case 'container-abn-3':
        return 100; // fully loaded 40ft container
      default:
        return 76;
    }
  };

  // Utilization for the 3D container view (can still be adjusted with the slider)
  const [utilization, setUtilization] = useState(() => getPlannedUtilization(container));

  useEffect(() => {
    setUtilization(getPlannedUtilization(container));
  }, [container.id]);

  // Standard container capacity and load configuration
  const { containerCapacityM3, usedVolume, cargoItems } = useMemo(() => {
    const capacity = getContainerCapacityM3(container.type);
    const plannedUtilization = getPlannedUtilization(container);

    const basePattern = [30, 12, 10];
    const baseTotal = basePattern.reduce((sum, v) => sum + v, 0); // 52

    const usedVolumeRaw = +(capacity * (plannedUtilization / 100)).toFixed(1);
    const scale = usedVolumeRaw > 0 ? usedVolumeRaw / baseTotal : 0;

    const volumes = basePattern.map((v) => +(v * scale).toFixed(1));
    const actualUsedVolume = +(volumes.reduce((sum, v) => sum + v, 0).toFixed(1));

    const colors = ['#38bdf8', '#3b82f6', '#1d4ed8'];
    const orderNumbers = ['ORD-001', 'ORD-002', 'ORD-003'];
    const descriptions = [
      'Electronics and computer equipment',
      'Textile and clothing items',
      'Household goods and furniture',
    ];
    const weights = [2200, 1200, 800];

    const items = basePattern.map((_, idx) => ({
      orderNumber: orderNumbers[idx] ?? `ORD-00${idx + 1}`,
      description: descriptions[idx] ?? 'Cargo line item',
      volume: volumes[idx],
      weight: weights[idx] ?? 0,
      color: colors[idx],
    }));

    return {
      containerCapacityM3: capacity,
      usedVolume: actualUsedVolume,
      cargoItems: items,
    };
  }, [container]);

  return (
    <div className="w-[32rem] h-screen overflow-y-auto border-r border-border bg-white scrollbar-sidebar">
      <div className="flex min-h-full flex-col gap-6 p-6">
        <div className="rounded-3xl bg-gradient-to-br from-[#150A66] to-[#3F2AA9] p-6 text-white shadow-xl">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-white/70">Container In Transit</p>
              <h2 className="mt-1 text-2xl font-semibold leading-tight">{container.number}</h2>
              {vesselName && (
                <p className="mt-2 flex items-center gap-2 text-sm text-white/80">
                  <Ship className="h-4 w-4" />
                  <span>On vessel {formatVesselName(vesselName)}</span>
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="rounded-2xl bg-white/15 p-2 text-white transition hover:bg-white/25"
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
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <p className="mt-3 text-sm text-white/80">Tracking reference updated • 15 mins ago</p>
        </div>

        <div className="rounded-3xl border border-slate-200/70 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[12px] uppercase tracking-wide text-muted-foreground">Container Utilization</p>
              <p className="text-xs text-muted-foreground">3D cargo view</p>
            </div>
            <p className="text-2xl font-semibold text-emerald-600">{utilization}%</p>
          </div>
          <div className="mt-4">
            <Container3D
              utilization={utilization}
              containerType={container.type}
              carrierName="Maersk"
            />
          </div>
        </div>

        <LoadConfigCard
          containerType={container.type}
          usedVolume={usedVolume}
          totalCapacity={containerCapacityM3}
          cargoItems={cargoItems}
        />

        <div className="rounded-3xl border border-slate-200/70 bg-white p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Delivery Milestones</h3>
            <span className="text-[11px] text-muted-foreground">Updated weekly</span>
          </div>
          <div className="mt-4 space-y-3">
            {milestones.map((milestone, index) => (
              <div
                key={index}
                className="flex items-center justify_between gap-3 rounded-2xl border border-slate-200/70 bg-white/70 px-4 py-3"
              >
                <div className="flex flex-1 items-center gap-3">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      milestone.completed ? 'bg-emerald-500 ring-4 ring-emerald-100' : 'bg-slate-400 ring-4 ring-slate-200'
                    } ring-offset-2 ring-offset-white`}
                  />
                  <div>
                    <p className="text-[13px] font-semibold text-foreground">{milestone.title}</p>
                    <p className="text-[11px] text-muted-foreground">Scheduled • {milestone.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <CalendarDays className="h-3 w-3" />
                  <span>{milestone.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200/70 bg-white p-5">
          <h3 className="text-sm font-semibold text-foreground">Delivery Location</h3>
          <div className="mt-3 flex items-start gap-3 text-[12px] text-muted-foreground">
            <MapPin className="h-4 w-4 text-[#C2410C]" />
            <div>
              <p className="font-semibold text-foreground">Consignee Warehouse</p>
              <p>Units 5-7, Arrow Valley Industrial Estate</p>
              <p>Claybrook Drive, Redditch B98 0FY, United Kingdom</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContainerDetails;
