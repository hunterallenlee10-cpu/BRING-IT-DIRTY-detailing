import "server-only";
import { siteConfig, fill } from "@/site.config";
import { db, type Lead } from "./db";
import { env } from "./env";
import { formatDayLong, formatSlot, formatTime } from "./time";
import { serviceById, vehicleLabel } from "./pricing";
import { toE164 } from "./phone";

export async function sendSms(to: string, body: string) {
  const sid = process.env.TWILIO_ACCOUNT_SID!;
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${sid}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64"),
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ To: toE164(to), From: process.env.TWILIO_FROM_NUMBER!, Body: body }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Twilio ${res.status}: ${(await res.text()).slice(0, 200)}`);
}

const first = (n: string) => n.trim().split(/\s+/)[0];

function messages(lead: Lead) {
  const svc = lead.service ? serviceById(lead.service).name : "detail";
  if (lead.kind === "booking" && lead.slot_start) {
    const d = new Date(lead.slot_start);
    const vars = { day: formatDayLong(d), time: formatTime(d).replace(/^0/, ""), service: svc, name: lead.name, vehicle: lead.vehicle ? vehicleLabel(lead.vehicle) : "" };
    return { customer: fill(siteConfig.copy.smsCustomer, vars), owner: fill(siteConfig.copy.smsOwner, vars) };
  }
  return {
    customer: `${siteConfig.brand.name}: Thanks ${first(lead.name)}! We got your question and will text you back shortly.`,
    owner: `New ${lead.kind}: ${lead.name} (${lead.phone})${lead.message ? `: ${lead.message.slice(0, 120)}` : ""}`,
  };
}

/**
 * Instant follow-up for a new lead. Runs in after(), so it never delays the visitor's response.
 * Twilio → texts the customer + the owner. n8n → receives the full lead JSON. Then follow_up is written.
 */
export async function notify(lead: Lead) {
  const created = new Date(lead.created_at).getTime();
  const msgs = messages(lead);
  let followUp: string | null = null;

  if (env.hasTwilio) {
    try {
      await Promise.all([
        sendSms(lead.phone, msgs.customer),
        process.env.OWNER_ALERT_PHONE ? sendSms(process.env.OWNER_ALERT_PHONE, msgs.owner) : Promise.resolve(),
      ]);
      followUp = `✓ Text sent in ${Math.max(1, Math.round((Date.now() - created) / 1000))}s`;
    } catch (e) {
      console.error("[notify] twilio", e);
      followUp = "Text failed · call back";
    }
  }

  if (env.hasN8n) {
    try {
      await fetch(process.env.N8N_WEBHOOK_URL!, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ event: "lead.created", brand: siteConfig.brand.name, lead, slotLabel: lead.slot_start ? formatSlot(new Date(lead.slot_start), new Date(), false) : null }),
        signal: AbortSignal.timeout(8000),
      });
      if (!followUp) followUp = "✓ Auto-reply sent";
    } catch (e) {
      console.error("[notify] n8n", e);
    }
  }

  if (!followUp && process.env.DEMO_SIMULATE_SMS === "1" && !env.hasSupabase) {
    // sales-demo only: pretend the confirmation text went out
    await new Promise((r) => setTimeout(r, 2500 + Math.random() * 1500));
    followUp = `✓ Text sent in ${Math.max(1, Math.round((Date.now() - created) / 1000))}s`;
  }

  await db().updateLead(lead.id, { follow_up: followUp ?? "Pending follow-up", follow_up_at: followUp ? new Date().toISOString() : null });
}
