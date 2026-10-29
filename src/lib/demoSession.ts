/**
 * Demo-mode owner session (used only when Supabase isn't configured).
 * Token = base64url(payload).base64url(HMAC-SHA256). Web Crypto, so it runs in middleware and Node alike.
 */
export const DEMO_COOKIE = "rl_owner";
const MAX_AGE_S = 60 * 60 * 12;

export function demoSecret(): string | null {
  return process.env.DEMO_SESSION_SECRET || (process.env.NODE_ENV !== "production" ? "dev-only-demo-secret-change-me" : null);
}

export function demoCredentials() {
  const prod = process.env.NODE_ENV === "production";
  return {
    email: (process.env.DEMO_OWNER_EMAIL || (prod ? "" : "owner@example.com")).toLowerCase(),
    password: process.env.DEMO_OWNER_PASSWORD || (prod ? "" : "bring-it-dirty"),
  };
}

const enc = new TextEncoder();
const b64url = (buf: ArrayBuffer | Uint8Array) => {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = "";
  bytes.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
const fromB64url = (s: string) => {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
};

async function hmac(data: string, secret: string) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64url(await crypto.subtle.sign("HMAC", key, enc.encode(data)));
}

export async function signDemo(email: string) {
  const secret = demoSecret();
  if (!secret) throw new Error("DEMO_SESSION_SECRET is not set");
  const payload = b64url(enc.encode(JSON.stringify({ e: email, x: Math.floor(Date.now() / 1000) + MAX_AGE_S })));
  return { token: `${payload}.${await hmac(payload, secret)}`, maxAge: MAX_AGE_S };
}

/** Returns the owner email if the token is valid and unexpired. */
export async function verifyDemo(token: string | undefined | null): Promise<string | null> {
  const secret = demoSecret();
  if (!token || !secret) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expect = await hmac(payload, secret);
  if (expect.length !== sig.length) return null;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= expect.charCodeAt(i) ^ sig.charCodeAt(i);
  if (diff !== 0) return null;
  try {
    const data = JSON.parse(new TextDecoder().decode(fromB64url(payload))) as { e: string; x: number };
    if (data.x < Date.now() / 1000) return null;
    return data.e;
  } catch {
    return null;
  }
}

/** Constant-time string compare for credentials. */
export function safeEqual(a: string, b: string) {
  const len = Math.max(a.length, b.length, 1);
  let diff = a.length ^ b.length;
  for (let i = 0; i < len; i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}
