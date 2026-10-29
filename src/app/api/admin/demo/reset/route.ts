import { NextResponse } from "next/server";
import { getOwner } from "@/lib/auth";
import { env } from "@/lib/env";
import { resetDemo } from "@/lib/db/local";

export const dynamic = "force-dynamic";

/** Demo mode only: restore the six sample leads relative to now. */
export async function POST() {
  if (!(await getOwner())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (env.hasSupabase) return NextResponse.json({ error: "demo_only" }, { status: 400 });
  resetDemo();
  return NextResponse.json({ ok: true });
}
