/**
 * npm run seed
 * Supabase configured → replaces the demo rows in public.leads with the six reference rows (relative to now).
 * Otherwise → resets the local demo store (.data/leads.json).
 */
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { demoLeads } from "../src/lib/db/seedRows";

try {
  process.loadEnvFile?.(".env.local");
} catch {
  /* no .env.local */
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const rows = demoLeads();

if (url && key) {
  const sb = createClient(url, key, { auth: { persistSession: false } });
  const phones = rows.map((r) => r.phone);
  const del = await sb.from("leads").delete().in("phone", phones);
  if (del.error) throw del.error;
  const ins = await sb.from("leads").insert(rows.map(({ ...r }) => ({ ...r, utm: {} })));
  if (ins.error) throw ins.error;
  console.log(`Seeded ${rows.length} demo leads into Supabase.`);
} else {
  const file = path.join(process.cwd(), ".data", "leads.json");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const leads = rows.map((r) => ({
    id: randomUUID(),
    created_at: r.created_at ?? new Date().toISOString(),
    email: null, vehicle: null, service: null, slot_start: null, ready_at: null, status: "new",
    follow_up: null, follow_up_at: null, est_price: null, message: null, utm: {}, notes: null,
    ...r,
  }));
  fs.writeFileSync(file, JSON.stringify(leads, null, 1));
  console.log(`Demo mode: wrote ${leads.length} leads to .data/leads.json (restart \`npm run dev\` to reload).`);
}
