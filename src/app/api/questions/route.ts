import { after, NextResponse } from "next/server";
import { questionSchema } from "@/lib/schemas";
import { db } from "@/lib/db";
import { notify } from "@/lib/notify";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { maskPhone } from "@/lib/phone";
import { normaliseSource } from "@/lib/source";
import { priceFor } from "@/lib/pricing";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const limit = await rateLimit(`ask:${clientIp(req)}`);
  if (!limit.ok) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = questionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid", issues: parsed.error.issues.map((i) => ({ path: i.path.map(String), message: i.message })) }, { status: 400 });
  }
  const q = parsed.data;
  if (q.website) return NextResponse.json({ ok: true }, { status: 201 });

  const lead = await db().insertLead({
    name: q.name.trim(),
    phone: maskPhone(q.phone),
    email: q.email?.trim() || null,
    vehicle: q.vehicle ?? null,
    service: q.service ?? null,
    kind: q.kind,
    status: q.kind === "quote" ? "quote" : "new",
    message: q.message,
    source: normaliseSource(q.source || "website"),
    utm: q.utm ?? {},
    est_price: q.service ? priceFor(q.service, q.vehicle) : null,
  });
  after(() => notify(lead).catch((e) => console.error("[notify]", e)));
  return NextResponse.json({ ok: true, id: lead.id }, { status: 201 });
}
