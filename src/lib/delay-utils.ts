import type { Shipment } from "@/types/shipment";

export type DelayStage = "pickup" | "departure" | "arrival" | "delivery";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export const parseDateString = (dateStr: string | null | undefined): Date | null => {
  if (!dateStr) return null;
  const [day, month, year] = dateStr.split("/").map((value) => parseInt(value, 10));
  if (!day || !month || !year) return null;
  return new Date(year, month - 1, day);
};

export const calculateDelayDays = (
  plannedDate: string | null | undefined,
  actualDate: string | null | undefined,
): number | null => {
  if (!plannedDate || !actualDate) return null;
  const planned = parseDateString(plannedDate);
  const actual = parseDateString(actualDate);
  if (!planned || !actual) return null;
  const diff = actual.getTime() - planned.getTime();
  const diffDays = Math.ceil(diff / MS_PER_DAY);
  return diffDays > 0 ? diffDays : 0;
};

export const getStageDelay = (stage: DelayStage, shipment: Shipment | null | undefined): number | null => {
  if (!shipment) return null;
  switch (stage) {
    case "pickup":
      return calculateDelayDays(shipment.pickup, shipment.pickupActualDate);
    case "departure":
      return calculateDelayDays(shipment.departure, shipment.departureActualDate);
    case "arrival":
      return calculateDelayDays(shipment.arrival, shipment.arrivalActualDate);
    case "delivery":
      return calculateDelayDays(shipment.delivery, shipment.deliveryActualDate);
    default:
      return null;
  }
};

