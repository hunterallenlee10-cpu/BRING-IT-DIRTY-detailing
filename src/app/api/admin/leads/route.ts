import { NextResponse } from "next/server";
import { getOwner } from "@/lib/auth";
import { ownerLeads } from "@/lib/adminData";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await getOwner())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json({ leads: await ownerLeads() }, { headers: { "Cache-Control": "no-store" } });
}
