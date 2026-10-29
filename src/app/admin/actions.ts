"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { env } from "@/lib/env";
import { isAllowListed } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { DEMO_COOKIE, demoCredentials, demoSecret, safeEqual, signDemo } from "@/lib/demoSession";
import { rateLimit } from "@/lib/rateLimit";

export interface LoginState {
  error?: string;
  email?: string;
}

export async function signIn(_prev: LoginState, form: FormData): Promise<LoginState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password.", email };

  const h = await headers();
  const ip = (h.get("x-forwarded-for")?.split(",")[0] || "local").trim();
  const rl = await rateLimit(`login:${ip}`, 8, 10 * 60_000);
  if (!rl.ok) return { error: "Too many attempts. Wait a few minutes and try again.", email };

  if (env.hasSupabase) {
    const sb = await supabaseServer();
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error || !data.user) return { error: "That email and password don't match.", email };
    if (!(await isAllowListed(email))) {
      await sb.auth.signOut();
      return { error: "Not authorized.", email };
    }
  } else {
    const creds = demoCredentials();
    if (!demoSecret() || !creds.email) return { error: "Owner login isn't configured yet (see README → Owner OS).", email };
    if (!safeEqual(email, creds.email) || !safeEqual(password, creds.password)) return { error: "That email and password don't match.", email };
    const { token, maxAge } = await signDemo(email);
    (await cookies()).set(DEMO_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge });
  }
  redirect("/admin/leads");
}

export async function signOut() {
  if (env.hasSupabase) {
    const sb = await supabaseServer();
    await sb.auth.signOut();
  }
  (await cookies()).delete(DEMO_COOKIE);
  redirect("/admin/login");
}
