import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { env } from "./env";
import { siteConfig } from "@/site.config";
import { supabaseServer } from "./supabase/server";
import { supabaseAdmin } from "./supabase/admin";
import { DEMO_COOKIE, verifyDemo } from "./demoSession";

export interface Owner {
  email: string;
  mode: "supabase" | "demo";
}

/** Allow-list: public.admins (created by `npm run create-owner`) plus OWNER_EMAILS from env. */
export async function isAllowListed(email: string) {
  const e = email.toLowerCase();
  if (siteConfig.owner.emails().includes(e)) return true;
  if (!env.hasSupabase) return false;
  const { data } = await supabaseAdmin().from("admins").select("email").eq("email", e).maybeSingle();
  return !!data;
}

export async function getOwner(): Promise<Owner | null> {
  return (await ownerState()).owner;
}

/** owner = allow-listed; strangerSignedIn = has a Supabase session but isn't on the list. */
export async function ownerState(): Promise<{ owner: Owner | null; strangerSignedIn: boolean }> {
  if (env.hasSupabase) {
    const sb = await supabaseServer();
    const { data } = await sb.auth.getUser();
    const email = data.user?.email;
    if (!email) return { owner: null, strangerSignedIn: false };
    return (await isAllowListed(email)) ? { owner: { email, mode: "supabase" }, strangerSignedIn: false } : { owner: null, strangerSignedIn: true };
  }
  const store = await cookies();
  const email = await verifyDemo(store.get(DEMO_COOKIE)?.value);
  return { owner: email ? { email, mode: "demo" } : null, strangerSignedIn: false };
}

/** Use at the top of every /admin page, layout and admin API route. */
export async function requireOwner(): Promise<Owner> {
  const { owner, strangerSignedIn } = await ownerState();
  // signed in but not on the allow-list: sign them out (needs a route handler to clear cookies)
  if (strangerSignedIn) redirect("/api/admin/signout?reason=not_authorized");
  if (!owner) redirect("/admin/login");
  return owner;
}
