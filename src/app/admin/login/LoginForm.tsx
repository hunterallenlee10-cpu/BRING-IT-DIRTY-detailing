"use client";

import { useActionState } from "react";
import { siteConfig } from "@/site.config";
import { LogoSquare } from "@/components/ui/Logo";
import { Arrow } from "@/components/ui/Arrow";
import { signIn, type LoginState } from "../actions";

export function LoginForm({ hint, initialError }: { hint: { email: string; password: string } | null; initialError?: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(signIn, { error: initialError });
  return (
    <form
      action={action}
      className="relative w-full max-w-[380px] rounded-[18px] border border-red/60 bg-[rgba(18,18,20,.82)] p-7 shadow-[0_0_0_1px_rgba(255,42,31,.2),0_0_50px_rgba(255,42,31,.25),0_30px_80px_rgba(0,0,0,.6)] backdrop-blur-xl"
    >
      <div className="flex items-center gap-2.5">
        <LogoSquare />
        <span className="flex flex-col leading-none">
          <span className="display text-[18px] tracking-[0.02em]">{siteConfig.brand.name}</span>
          <span className="mt-1 font-mono text-[9px] tracking-[0.28em] text-muted">STUDIO OS</span>
        </span>
      </div>
      <h1 className="display glow-white mt-8 text-[42px]">
        WELCOME BACK,
        <br />
        OWNER.
      </h1>
      <p className="mt-3 text-[15px] text-muted">Sign in to see today&apos;s leads.</p>

      <div className="mt-7 flex flex-col gap-4">
        <div>
          <label htmlFor="email" className="hud mb-2 block text-[10px] text-muted">
            EMAIL
          </label>
          <input id="email" name="email" type="email" autoComplete="username" required defaultValue={state.email} className="input" aria-invalid={!!state.error} />
        </div>
        <div>
          <label htmlFor="password" className="hud mb-2 block text-[10px] text-muted">
            PASSWORD
          </label>
          <input id="password" name="password" type="password" autoComplete="current-password" required className="input" aria-invalid={!!state.error} />
        </div>
      </div>

      <p role="alert" aria-live="assertive" className="mt-3 min-h-5 text-[14px] text-[#ff8a80]">
        {state.error}
      </p>

      <button
        type="submit"
        disabled={pending}
        className="mt-2 flex h-[52px] w-full items-center justify-center gap-3 rounded-[12px] text-[13px] font-semibold uppercase tracking-[0.08em] text-white shadow-[0_0_28px_rgba(255,80,30,.45)] transition-opacity disabled:opacity-60"
        style={{ background: "var(--cta-gradient)" }}
      >
        {pending ? "SIGNING IN…" : "SIGN IN"} {!pending && <Arrow />}
      </button>

      {hint && (
        <p className="mt-5 rounded-[10px] border border-dashed border-white/15 px-3 py-2.5 font-mono text-[11px] leading-relaxed text-muted">
          DEMO MODE · {hint.email} / {hint.password}
        </p>
      )}
    </form>
  );
}
