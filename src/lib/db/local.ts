import "server-only";
import { EventEmitter } from "node:events";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { DataStore, Lead, LeadEvent, LeadPatch, NewLead } from "./types";
import { demoLeads } from "./seedRows";

/**
 * Demo adapter: in-memory leads, persisted to .data/leads.json so they survive dev restarts.
 * Single Node process, and bookSlot() never awaits between its count and its insert, so it is atomic.
 * For local demos only: on serverless hosts each instance has its own memory. Production uses Supabase.
 */
interface Mem {
  leads: Lead[];
  emitter: EventEmitter;
  timer: NodeJS.Timeout | null;
}

const FILE = path.join(process.cwd(), ".data", "leads.json");
const g = globalThis as unknown as { __rlDemo?: Mem };

function hydrate(row: NewLead): Lead {
  return {
    id: randomUUID(),
    created_at: row.created_at ?? new Date().toISOString(),
    name: row.name,
    phone: row.phone,
    email: row.email ?? null,
    vehicle: row.vehicle ?? null,
    service: row.service ?? null,
    kind: row.kind,
    slot_start: row.slot_start ?? null,
    ready_at: row.ready_at ?? null,
    source: row.source,
    status: row.status ?? "new",
    follow_up: row.follow_up ?? null,
    follow_up_at: row.follow_up_at ?? null,
    est_price: row.est_price ?? null,
    message: row.message ?? null,
    utm: row.utm ?? {},
    notes: row.notes ?? null,
  };
}

function mem(): Mem {
  if (g.__rlDemo) return g.__rlDemo;
  let leads: Lead[] = [];
  try {
    leads = JSON.parse(fs.readFileSync(FILE, "utf8")) as Lead[];
  } catch {
    leads = demoLeads().map(hydrate);
  }
  const emitter = new EventEmitter();
  emitter.setMaxListeners(100);
  g.__rlDemo = { leads, emitter, timer: null };
  return g.__rlDemo;
}

function persist() {
  const m = mem();
  if (m.timer) return;
  m.timer = setTimeout(() => {
    m.timer = null;
    try {
      fs.mkdirSync(path.dirname(FILE), { recursive: true });
      fs.writeFileSync(FILE, JSON.stringify(m.leads, null, 1));
    } catch {
      /* read-only filesystem (serverless): memory only */
    }
  }, 150);
}

function emit(e: LeadEvent) {
  mem().emitter.emit("lead", e);
}

export function onLeadEvent(fn: (e: LeadEvent) => void) {
  const m = mem();
  m.emitter.on("lead", fn);
  return () => m.emitter.off("lead", fn);
}

export function resetDemo(now = new Date()) {
  const m = mem();
  m.leads = demoLeads(now).map(hydrate);
  persist();
}

const active = (l: Lead) => l.kind === "booking" && (l.status === "new" || l.status === "booked");

export const localStore: DataStore = {
  mode: "demo",
  async activeSlotsBetween(from, to) {
    const a = from.getTime(), b = to.getTime();
    return mem()
      .leads.filter((l) => active(l) && l.slot_start && +new Date(l.slot_start) >= a && +new Date(l.slot_start) < b)
      .map((l) => l.slot_start!);
  },
  async bookSlot(row, bays) {
    const m = mem();
    const slot = row.slot_start ? +new Date(row.slot_start) : NaN;
    const taken = m.leads.filter((l) => active(l) && l.slot_start && +new Date(l.slot_start) === slot).length;
    if (taken >= bays) return { ok: false, reason: "slot_full" };
    const lead = hydrate(row);
    m.leads.push(lead);
    persist();
    emit({ type: "INSERT", lead });
    return { ok: true, lead };
  },
  async insertLead(row) {
    const lead = hydrate(row);
    mem().leads.push(lead);
    persist();
    emit({ type: "INSERT", lead });
    return lead;
  },
  async updateLead(id, patch: LeadPatch) {
    const m = mem();
    const i = m.leads.findIndex((l) => l.id === id);
    if (i < 0) return null;
    m.leads[i] = { ...m.leads[i], ...patch };
    persist();
    emit({ type: "UPDATE", lead: m.leads[i] });
    return m.leads[i];
  },
  async getLead(id) {
    return mem().leads.find((l) => l.id === id) ?? null;
  },
  async listLeads(limit = 200) {
    return [...mem().leads].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)).slice(0, limit);
  },
  async bookingsBetween(from, to) {
    const a = from.getTime(), b = to.getTime();
    return mem()
      .leads.filter((l) => l.kind === "booking" && l.slot_start && +new Date(l.slot_start) >= a && +new Date(l.slot_start) < b)
      .sort((x, y) => +new Date(x.slot_start!) - +new Date(y.slot_start!));
  },
};
