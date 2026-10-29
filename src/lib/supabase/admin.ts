import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

let client: SupabaseClient | null = null;

/** Service-role client. Bypasses RLS: server routes only, never imported by client code. */
export function supabaseAdmin() {
  if (!client) {
    client = createClient(env.supabaseUrl, env.serviceRole, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  return client;
}
