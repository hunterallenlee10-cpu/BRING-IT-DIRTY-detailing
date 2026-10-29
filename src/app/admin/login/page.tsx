import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getOwner } from "@/lib/auth";
import { env } from "@/lib/env";
import { demoCredentials } from "@/lib/demoSession";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  if (await getOwner()) redirect("/admin/leads");
  const showHint = !env.hasSupabase && (process.env.NODE_ENV !== "production" || process.env.DEMO_SHOW_HINT === "1");
  const creds = demoCredentials();
  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden px-4 py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[900px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(232,21,11,.55) 0%, rgba(232,21,11,.22) 30%, rgba(232,21,11,.06) 52%, rgba(232,21,11,0) 68%)",
          animation: "radial-breathe 6s ease-in-out infinite",
        }}
      />
      <LoginForm hint={showHint ? creds : null} initialError={error === "not_authorized" ? "Not authorized." : undefined} />
    </main>
  );
}
