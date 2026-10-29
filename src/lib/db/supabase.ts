import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { DataStore, Lead, NewLead } from "./types";

const ACTIVE = ["new", "booked"];

export const supabaseStore: DataStore = {
  mode: "supabase",
  async activeSlotsBetween(from, to) {
    const { data, error } = await supabaseAdmin()
      .from("leads")
      .select("slot_start")
      .eq("kind", "booking")
      .in("status", ACTIVE)
      .gte("slot_start", from.toISOString())
      .lt("slot_start", to.toISOString());
    if (error) throw error;
    return (data ?? []).map((r) => r.slot_start as string);
  },
  async bookSlot(lead, bays) {
    // book_slot() takes a per-slot advisory lock, re-counts and inserts in one transaction
    const { data, error } = await supabaseAdmin().rpc("book_slot", { p_lead: lead, p_bays: bays });
    if (error) {
      if (error.message?.includes("slot_full")) return { ok: false, reason: "slot_full" };
      throw error;
    }
    return { ok: true, lead: data as Lead };
  },
  async insertLead(lead: NewLead) {
    const { data, error } = await supabaseAdmin().from("leads").insert(lead).select("*").single();
    if (error) throw error;
    return data as Lead;
  },
  async updateLead(id, patch) {
    const { data, error } = await supabaseAdmin().from("leads").update(patch).eq("id", id).select("*").maybeSingle();
    if (error) throw error;
    return (data as Lead) ?? null;
  },
  async getLead(id) {
    const { data, error } = await supabaseAdmin().from("leads").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return (data as Lead) ?? null;
  },
  async listLeads(limit = 200) {
    const { data, error } = await supabaseAdmin().from("leads").select("*").order("created_at", { ascending: false }).limit(limit);
    if (error) throw error;
    return (data ?? []) as Lead[];
  },
  async bookingsBetween(from, to) {
    const { data, error } = await supabaseAdmin()
      .from("leads")
      .select("*")
      .eq("kind", "booking")
      .gte("slot_start", from.toISOString())
      .lt("slot_start", to.toISOString())
      .order("slot_start", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Lead[];
  },
};
