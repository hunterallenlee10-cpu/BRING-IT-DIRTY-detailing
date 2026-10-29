import "server-only";
import { env } from "@/lib/env";
import type { DataStore } from "./types";
import { localStore } from "./local";
import { supabaseStore } from "./supabase";

/** Supabase when configured, otherwise the local demo store. Same contract either way. */
export function db(): DataStore {
  return env.hasSupabase ? supabaseStore : localStore;
}

export type { DataStore, Lead, NewLead, LeadPatch, LeadEvent } from "./types";
