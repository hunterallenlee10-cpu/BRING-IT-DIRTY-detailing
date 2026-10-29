import { NextResponse } from "next/server";
import { getOwner } from "@/lib/auth";
import { ownerUpdateLead } from "@/lib/adminData";
import { leadPatchSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await getOwner())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const parsed = leadPatchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const lead = await ownerUpdateLead(id, parsed.data);
  if (!lead) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ lead });
}
