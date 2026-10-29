import { siteUrl } from "./siteUrl";

/** Feature flags derived from env. Server-side only for secrets; NEXT_PUBLIC_* are safe in the client. */
export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnon: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  get serviceRole() {
    return process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  },
  get hasSupabase() {
    return !!(this.supabaseUrl && this.supabaseAnon && this.serviceRole);
  },
  get hasTwilio() {
    return !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER);
  },
  get hasN8n() {
    return !!process.env.N8N_WEBHOOK_URL;
  },
  get hasUpstash() {
    return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
  },
  get siteUrl() {
    return siteUrl();
  },
};

/** Public flag the browser can read: is the live Supabase backend configured? */
export const publicHasSupabase = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
