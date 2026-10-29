import "server-only";
import { env } from "./env";
import { supabaseServer } from "./supabase/server";
import { localStore } from "./db/local";
import type { Lead, LeadPatch } from "./db/types";

/**
 * Owner-facing reads/writes. In Supabase mode these run as the signed-in owner, so the RLS policies
 * ("admins read/update leads") are the gate, not just app code.
 */
export async function ownerLeads(limit = 500): Promise<Lead[]> {
  if (env.hasSupabase) {
    const sb = await supabaseServer();
    const { data, error } = await sb.from("leads").select("*").order("created_at", { ascending: false }).limit(limit);
    if (error) throw error;
    return (data ?? []) as Lead[];
  }
  return localStore.listLeads(limit);
}

export async function ownerUpdateLead(id: string, patch: LeadPatch): Promise<Lead | null> {
  if (env.hasSupabase) {
    const sb = await supabaseServer();
    const { data, error } = await sb.from("leads").update(patch).eq("id", id).select("*").maybeSingle();
    if (error) throw error;
    return (data as Lead) ?? null;
  }
  return localStore.updateLead(id, patch);
}

export async function ownerGetLead(id: string): Promise<Lead | null> {
  if (env.hasSupabase) {
    const sb = await supabaseServer();
    const { data } = await sb.from("leads").select("*").eq("id", id).maybeSingle();
    return (data as Lead) ?? null;
  }
  return localStore.getLead(id);
}

/** What's switched on, for the Automations page and the lead panel. */
export function automationFlags() {
  return {
    mode: env.hasSupabase ? ("supabase" as const) : ("demo" as const),
    twilio: env.hasTwilio,
    ownerAlert: env.hasTwilio && !!process.env.OWNER_ALERT_PHONE,
    n8n: env.hasN8n,
    cron: !!process.env.CRON_SECRET,
    simulated: !env.hasSupabase && process.env.DEMO_SIMULATE_SMS === "1",
  };
}
export type AutomationFlags = ReturnType<typeof automationFlags>;
