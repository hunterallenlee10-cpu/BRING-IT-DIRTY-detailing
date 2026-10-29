import { NextResponse } from "next/server";
import { z } from "zod";
import { getOwner } from "@/lib/auth";
import { env } from "@/lib/env";
import { ownerGetLead, ownerUpdateLead } from "@/lib/adminData";
import { sendSms } from "@/lib/notify";

export const dynamic = "force-dynamic";
const body = z.object({ message: z.string().trim().min(1).max(600) });

/** Owner → customer text via Twilio (only when configured; the panel falls back to an sms: link). */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await getOwner())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!env.hasTwilio) return NextResponse.json({ error: "twilio_not_configured" }, { status: 501 });
  const { id } = await ctx.params;
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const lead = await ownerGetLead(id);
  if (!lead) return NextResponse.json({ error: "not_found" }, { status: 404 });
  try {
    await sendSms(lead.phone, parsed.data.message);
  } catch (e) {
    return NextResponse.json({ error: "send_failed", detail: String(e).slice(0, 200) }, { status: 502 });
  }
  const updated = await ownerUpdateLead(id, { follow_up: "✓ Texted by owner", follow_up_at: new Date().toISOString() });
  return NextResponse.json({ lead: updated });
}
