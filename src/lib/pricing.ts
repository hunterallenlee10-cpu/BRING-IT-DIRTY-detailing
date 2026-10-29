import { siteConfig, type ServiceId, type VehicleId } from "@/site.config";

export const services = siteConfig.services;
export const vehicles = siteConfig.booking.vehicles;

export const serviceById = (id: ServiceId) => services.find((s) => s.id === id)!;
export const vehicleLabel = (id: VehicleId) => vehicles.find((v) => v.id === id)?.label ?? id;

/** "from $" price for a service on a vehicle size, rounded to booking.priceRounding. */
export function priceFor(service: ServiceId, vehicle?: VehicleId | null) {
  const base = serviceById(service).basePrice;
  const mult = vehicle ? siteConfig.booking.sizeMultipliers[vehicle] ?? 1 : 1;
  if (mult === 1) return base;
  const r = siteConfig.booking.priceRounding || 1;
  return Math.round((base * mult) / r) * r;
}

export const money = (n: number) => `$${n.toLocaleString("en-US")}`;
