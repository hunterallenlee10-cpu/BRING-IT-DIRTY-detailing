import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { supabaseServer } from "@/lib/supabase/server";
import { DEMO_COOKIE } from "@/lib/demoSession";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (env.hasSupabase) await (await supabaseServer()).auth.signOut();
  const reason = new URL(req.url).searchParams.get("reason");
  const res = NextResponse.redirect(new URL(`/admin/login${reason === "not_authorized" ? "?error=not_authorized" : ""}`, req.url));
  res.cookies.delete(DEMO_COOKIE);
  return res;
}
