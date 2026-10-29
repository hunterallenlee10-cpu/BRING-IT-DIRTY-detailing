import { NextResponse } from "next/server";
import { getAvailability } from "@/lib/availability";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const n = Math.min(14, Math.max(1, Number(new URL(req.url).searchParams.get("days")) || 4));
  try {
    const data = await getAvailability(n);
    return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("[availability]", e);
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}
