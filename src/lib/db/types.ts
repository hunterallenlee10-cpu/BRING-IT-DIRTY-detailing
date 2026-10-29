import type { ServiceId, VehicleId } from "@/site.config";

export type LeadKind = "booking" | "question" | "quote";
export type LeadStatus = "new" | "booked" | "quote" | "follow_up" | "done" | "lost";

export interface Lead {
  id: string;
  created_at: string;
  name: string;
  phone: string;
  email: string | null;
  vehicle: VehicleId | null;
  service: ServiceId | null;
  kind: LeadKind;
  slot_start: string | null;
  ready_at: string | null;
  source: string;
  status: LeadStatus;
  follow_up: string | null;
  follow_up_at: string | null;
  est_price: number | null;
  message: string | null;
  utm: Record<string, string>;
  notes: string | null;
}

export type NewLead = Pick<Lead, "name" | "phone" | "kind" | "source"> &
  Partial<Pick<Lead, "email" | "vehicle" | "service" | "slot_start" | "ready_at" | "status" | "est_price" | "message" | "utm" | "follow_up" | "follow_up_at" | "notes">> & {
    created_at?: string;
  };

export type LeadPatch = Partial<Pick<Lead, "status" | "notes" | "follow_up" | "follow_up_at">>;

export type BookResult = { ok: true; lead: Lead } | { ok: false; reason: "slot_full" };

export interface LeadEvent {
  type: "INSERT" | "UPDATE";
  lead: Lead;
}

/** The one interface every route and admin page talks to. */
export interface DataStore {
  readonly mode: "supabase" | "demo";
  /** active (new/booked) booking slot_starts in [from, to) */
  activeSlotsBetween(from: Date, to: Date): Promise<string[]>;
  /** Atomic: re-checks capacity and inserts under a per-slot lock. */
  bookSlot(lead: NewLead, bays: number): Promise<BookResult>;
  insertLead(lead: NewLead): Promise<Lead>;
  updateLead(id: string, patch: LeadPatch): Promise<Lead | null>;
  getLead(id: string): Promise<Lead | null>;
  listLeads(limit?: number): Promise<Lead[]>;
  bookingsBetween(from: Date, to: Date): Promise<Lead[]>;
}
