/** First-touch source attribution, kept in sessionStorage. */
const KEY = "rl_source_v1";

export interface SourceInfo {
  source: string;
  utm: Record<string, string>;
}

export function classifyReferrer(ref: string): string {
  let host = "";
  try {
    host = new URL(ref).hostname.replace(/^www\./, "");
  } catch {
    return "website";
  }
  if (/(^|\.)google\./.test(host)) return "google";
  if (host === "chatgpt.com" || host === "chat.openai.com" || host.endsWith(".chatgpt.com")) return "chatgpt";
  if (host.endsWith("perplexity.ai")) return "perplexity";
  if (host === "instagram.com" || host === "l.instagram.com" || host.endsWith(".instagram.com")) return "instagram";
  if (host.endsWith("facebook.com") || host === "l.facebook.com" || host === "m.facebook.com") return "facebook";
  if (host.endsWith("bing.com")) return "bing";
  return "website";
}

export function normaliseSource(s: string) {
  const v = s.trim().toLowerCase();
  const map: Record<string, string> = { ig: "instagram", fb: "facebook", gpt: "chatgpt", openai: "chatgpt" };
  return (map[v] ?? v).slice(0, 40) || "website";
}

/** Call once on page load. Returns the stored first touch, or computes and stores it. */
export function captureSource(): SourceInfo {
  try {
    const stored = sessionStorage.getItem(KEY);
    if (stored) return JSON.parse(stored) as SourceInfo;
  } catch {
    /* storage blocked: fall through and compute */
  }
  const params = new URLSearchParams(window.location.search);
  const utm: Record<string, string> = {};
  for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"]) {
    const v = params.get(k);
    if (v) utm[k] = v.slice(0, 120);
  }
  const sameSite = document.referrer && new URL(document.referrer, location.href).host === location.host;
  const source = utm.utm_source ? normaliseSource(utm.utm_source) : document.referrer && !sameSite ? classifyReferrer(document.referrer) : "website";
  const info = { source, utm };
  try {
    sessionStorage.setItem(KEY, JSON.stringify(info));
  } catch {
    /* ignore */
  }
  return info;
}
