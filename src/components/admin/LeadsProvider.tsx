"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Lead, LeadEvent, LeadPatch } from "@/lib/db/types";
import type { AutomationFlags } from "@/lib/adminData";
import { sourceInfo } from "./format";

export interface ToastMsg {
  id: number;
  text: string;
  tone: "lead" | "error" | "info";
}

interface Ctx {
  leads: Lead[];
  now: Date;
  query: string;
  setQuery: (q: string) => void;
  highlighted: Set<string>;
  selectedId: string | null;
  select: (id: string | null) => void;
  update: (id: string, patch: LeadPatch) => Promise<boolean>;
  toasts: ToastMsg[];
  toast: (text: string, tone?: ToastMsg["tone"]) => void;
  dismiss: (id: number) => void;
  sound: boolean;
  setSound: (on: boolean) => void;
  flags: AutomationFlags;
  owner: string;
  live: "connecting" | "live" | "offline";
}

const C = createContext<Ctx | null>(null);
const SOUND_KEY = "rl_admin_sound";
const HIGHLIGHT_MS = 8000;

/** Soft two-note chime with WebAudio (no asset). */
function chime() {
  try {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ac = new Ctor();
    const t = ac.currentTime;
    [880, 1320].forEach((f, i) => {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = "sine";
      o.frequency.value = f;
      g.gain.setValueAtTime(0, t + i * 0.12);
      g.gain.linearRampToValueAtTime(0.12, t + i * 0.12 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.12 + 0.5);
      o.connect(g).connect(ac.destination);
      o.start(t + i * 0.12);
      o.stop(t + i * 0.12 + 0.55);
    });
    setTimeout(() => ac.close(), 900);
  } catch {
    /* audio blocked */
  }
}

export function LeadsProvider({
  initial,
  serverNow,
  mode,
  flags,
  owner,
  children,
}: {
  initial: Lead[];
  serverNow: string;
  mode: "supabase" | "demo";
  flags: AutomationFlags;
  owner: string;
  children: ReactNode;
}) {
  const [leads, setLeads] = useState<Lead[]>(initial);
  const [now, setNow] = useState(() => new Date(serverNow));
  const [query, setQuery] = useState("");
  const [selectedId, select] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const [sound, setSoundState] = useState(false);
  const [live, setLive] = useState<Ctx["live"]>("connecting");
  const [highlighted, setHighlighted] = useState<Set<string>>(() => {
    // the newest row glows on first paint if it just came in (matches the reference "just now" row)
    const fresh = initial.filter((l) => new Date(serverNow).getTime() - new Date(l.created_at).getTime() < 60_000).map((l) => l.id);
    return new Set(fresh.slice(0, 1));
  });
  const soundRef = useRef(false);
  const toastId = useRef(0);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    setNow(new Date());
    try {
      const on = localStorage.getItem(SOUND_KEY) === "1";
      setSoundState(on);
      soundRef.current = on;
    } catch {
      /* storage blocked */
    }
    return () => clearInterval(id);
  }, []);

  const unhighlight = useCallback((id: string) => {
    setTimeout(() => setHighlighted((s) => {
      const n = new Set(s);
      n.delete(id);
      return n;
    }), HIGHLIGHT_MS);
  }, []);
  useEffect(() => {
    highlighted.forEach((id) => unhighlight(id));
    // only the initial set; later inserts schedule their own
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const toast = useCallback(
    (text: string, tone: ToastMsg["tone"] = "info") => {
      const id = ++toastId.current;
      setToasts((t) => [...t.slice(-2), { id, text, tone }]);
      setTimeout(() => dismiss(id), 5200);
    },
    [dismiss],
  );

  const setSound = useCallback((on: boolean) => {
    setSoundState(on);
    soundRef.current = on;
    try {
      localStorage.setItem(SOUND_KEY, on ? "1" : "0");
    } catch {
      /* ignore */
    }
    if (on) chime();
  }, []);

  const known = useRef(new Set(initial.map((l) => l.id)));

  const apply = useCallback(
    (e: LeadEvent) => {
      if (e.type === "INSERT") {
        if (known.current.has(e.lead.id)) return;
        known.current.add(e.lead.id);
        setLeads((cur) => [e.lead, ...cur.filter((l) => l.id !== e.lead.id)]);
        setHighlighted((s) => new Set(s).add(e.lead.id));
        unhighlight(e.lead.id);
        const src = sourceInfo(e.lead.source).label;
        const from = e.lead.source === "website" ? "your website" : src;
        const what = e.lead.kind === "booking" ? "booking" : e.lead.kind === "quote" ? "quote request" : "question";
        toast(`New ${what} from ${from}`, "lead");
        if (soundRef.current) chime();
      } else {
        setLeads((cur) => cur.map((l) => (l.id === e.lead.id ? { ...l, ...e.lead } : l)));
      }
    },
    [toast, unhighlight],
  );

  const refetch = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/leads", { cache: "no-store" });
      if (!res.ok) return;
      const { leads: fresh } = (await res.json()) as { leads: Lead[] };
      const byId = new Map(fresh.map((l) => [l.id, l]));
      setLeads((cur) => cur.map((l) => byId.get(l.id) ?? l));
      fresh.filter((l) => !known.current.has(l.id)).reverse().forEach((l) => apply({ type: "INSERT", lead: l }));
    } catch {
      /* offline */
    }
  }, [apply]);

  // realtime: Supabase channel, or the demo SSE stream
  useEffect(() => {
    let cleanup = () => {};
    if (mode === "demo") {
      const es = new EventSource("/api/admin/stream");
      es.onopen = () => setLive("live");
      es.onerror = () => setLive("offline");
      es.addEventListener("lead", (ev) => apply(JSON.parse((ev as MessageEvent).data) as LeadEvent));
      cleanup = () => es.close();
    } else {
      let off = false;
      import("@/lib/supabase/client").then(({ supabaseBrowser }) => {
        if (off) return;
        const sb = supabaseBrowser();
        const ch = sb
          .channel("leads-live")
          .on("postgres_changes", { event: "INSERT", schema: "public", table: "leads" }, (p) => apply({ type: "INSERT", lead: p.new as Lead }))
          .on("postgres_changes", { event: "UPDATE", schema: "public", table: "leads" }, (p) => apply({ type: "UPDATE", lead: p.new as Lead }))
          .subscribe((status) => setLive(status === "SUBSCRIBED" ? "live" : status === "CHANNEL_ERROR" || status === "TIMED_OUT" ? "offline" : "connecting"));
        cleanup = () => {
          sb.removeChannel(ch);
        };
      });
      const prev = cleanup;
      cleanup = () => {
        off = true;
        prev();
      };
    }
    // catch anything missed while the tab slept
    const onVis = () => document.visibilityState === "visible" && refetch();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      cleanup();
    };
  }, [mode, apply, refetch]);

  const update = useCallback(
    async (id: string, patch: LeadPatch) => {
      let before: Lead | undefined;
      setLeads((cur) =>
        cur.map((l) => {
          if (l.id !== id) return l;
          before = l;
          return { ...l, ...patch };
        }),
      );
      try {
        const res = await fetch(`/api/admin/leads/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(patch) });
        if (!res.ok) throw new Error(String(res.status));
        const { lead } = (await res.json()) as { lead: Lead };
        setLeads((cur) => cur.map((l) => (l.id === id ? lead : l)));
        return true;
      } catch {
        if (before) setLeads((cur) => cur.map((l) => (l.id === id ? before! : l)));
        toast("Couldn't save that change. Check your connection.", "error");
        return false;
      }
    },
    [toast],
  );

  const value = useMemo<Ctx>(
    () => ({ leads, now, query, setQuery, highlighted, selectedId, select, update, toasts, toast, dismiss, sound, setSound, flags, owner, live }),
    [leads, now, query, highlighted, selectedId, update, toasts, toast, dismiss, sound, setSound, flags, owner, live],
  );
  return <C.Provider value={value}>{children}</C.Provider>;
}

export function useLeads() {
  const c = useContext(C);
  if (!c) throw new Error("useLeads must be used inside <LeadsProvider>");
  return c;
}
