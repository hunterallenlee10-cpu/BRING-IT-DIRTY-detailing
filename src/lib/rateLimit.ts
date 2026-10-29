import "server-only";
import { env } from "./env";

/**
 * Fixed-window limiter. In-memory LRU by default; Upstash Redis (REST) when UPSTASH_* is set,
 * which is what you want on serverless where every instance has its own memory.
 */
const WINDOW_MS = 10 * 60_000;
const LIMIT = 5;
const MAX_KEYS = 5000;
const g = globalThis as unknown as { __rlHits?: Map<string, number[]> };
const hits: Map<string, number[]> = (g.__rlHits ??= new Map<string, number[]>());

function memory(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const list = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (list.length >= limit) {
    hits.delete(key);
    hits.set(key, list);
    return { ok: false, retryAfter: Math.ceil((windowMs - (now - list[0])) / 1000) };
  }
  list.push(now);
  hits.delete(key); // refresh LRU order
  hits.set(key, list);
  if (hits.size > MAX_KEYS) hits.delete(hits.keys().next().value!);
  return { ok: true, retryAfter: 0 };
}

async function upstash(key: string, limit: number, windowMs: number) {
  const bucket = `rl:${key}:${Math.floor(Date.now() / windowMs)}`;
  const res = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`, "content-type": "application/json" },
    body: JSON.stringify([["INCR", bucket], ["PEXPIRE", bucket, String(windowMs)]]),
    signal: AbortSignal.timeout(1500),
  });
  const out = (await res.json()) as { result: number }[];
  const count = out[0]?.result ?? 0;
  return { ok: count <= limit, retryAfter: count <= limit ? 0 : Math.ceil(windowMs / 1000) };
}

export async function rateLimit(key: string, limit = LIMIT, windowMs = WINDOW_MS) {
  if (env.hasUpstash) {
    try {
      return await upstash(key, limit, windowMs);
    } catch {
      /* Redis down: fall back to memory rather than blocking bookings */
    }
  }
  return memory(key, limit, windowMs);
}

export function clientIp(req: Request) {
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd?.split(",")[0] || req.headers.get("x-real-ip") || "local").trim();
}
