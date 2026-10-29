import { getOwner } from "@/lib/auth";
import { env } from "@/lib/env";
import { onLeadEvent } from "@/lib/db/local";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Demo-mode realtime: Server-Sent Events from the in-process store. Supabase mode uses Supabase Realtime instead. */
export async function GET(req: Request) {
  if (!(await getOwner())) return new Response("unauthorized", { status: 401 });
  if (env.hasSupabase) return new Response(null, { status: 204 });

  const encoder = new TextEncoder();
  let cleanup = () => {};
  const stream = new ReadableStream({
    start(controller) {
      const send = (chunk: string) => {
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          cleanup();
        }
      };
      send(": connected\n\n");
      const off = onLeadEvent((e) => send(`event: lead\ndata: ${JSON.stringify(e)}\n\n`));
      const ping = setInterval(() => send(": ping\n\n"), 20_000);
      cleanup = () => {
        off();
        clearInterval(ping);
      };
      req.signal.addEventListener("abort", () => {
        cleanup();
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      });
    },
    cancel() {
      cleanup();
    },
  });
  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive", "X-Accel-Buffering": "no" },
  });
}
