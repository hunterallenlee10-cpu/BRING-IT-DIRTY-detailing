/**
 * Progressive image-sequence loader for the film.
 *
 * - Everything (stills + chapter frames) sits on one global timeline, in film order.
 * - Fetches compressed blobs by priority: what's at/just ahead of the scroll position first, coarse frames
 *   (every 8th) before fine ones, at least ~1.5 chapters ahead.
 * - Decodes only a window around the position into ImageBitmaps and closes the rest, so memory stays
 *   bounded on phones (a decoded 1600×900 frame is ~5.7MB; compressed it's ~25–70KB).
 * - get() returns the exact frame or the nearest decoded one, so a draw is never blank.
 */

export type Drawable = ImageBitmap | HTMLImageElement;

export interface SeqItem {
  key: string;
  url: string;
  chapter: string;
  index: number;
  still?: boolean;
}

interface Entry extends SeqItem {
  g: number; // global position
  blob?: Blob;
  img?: Drawable;
  fetching?: boolean;
  decoding?: boolean;
  failed?: number;
}

export interface SequenceOptions {
  items: SeqItem[];
  /** called when something near the current position becomes drawable */
  onUpdate: () => void;
  /** called with 0..1 for the initial (above-the-fold) set */
  onBootProgress?: (ratio: number) => void;
  bootKeys: string[];
}

const FETCH_CONCURRENCY = 6;
const DECODE_CONCURRENCY = 3;
const DECODE_BEHIND = 6;
const DECODE_AHEAD = 16;
const KEEP_BEHIND = 10;
const KEEP_AHEAD = 22;

const canBitmap = typeof window !== "undefined" && "createImageBitmap" in window;

export class FrameSequence {
  private entries: Entry[];
  private byKey = new Map<string, Entry>();
  private byChapter = new Map<string, Entry[]>();
  private pos = 0;
  private fetching = 0;
  private decoding = 0;
  private disposed = false;
  private opts: SequenceOptions;
  private bootDone = false;
  private abort = new AbortController();

  constructor(opts: SequenceOptions) {
    this.opts = opts;
    this.entries = opts.items.map((it, g) => ({ ...it, g }));
    for (const e of this.entries) {
      this.byKey.set(e.key, e);
      if (!e.still) {
        const list = this.byChapter.get(e.chapter) ?? [];
        list.push(e);
        this.byChapter.set(e.chapter, list);
      }
    }
    this.pump();
  }

  /** Global position of a chapter frame (or still) for focus(). */
  globalOf(key: string) {
    return this.byKey.get(key)?.g ?? 0;
  }

  focus(g: number) {
    const next = Math.max(0, Math.min(this.entries.length - 1, Math.round(g)));
    if (next === this.pos) return;
    this.pos = next;
    this.evict();
    this.pump();
  }

  /** Exact frame if decoded, else the nearest decoded frame of the same chapter. */
  frame(chapter: string, index: number): Drawable | null {
    const list = this.byChapter.get(chapter);
    if (!list || !list.length) return null;
    const i = Math.max(0, Math.min(list.length - 1, index));
    if (list[i].img) return list[i].img!;
    if (list[i].blob && !list[i].decoding) this.decode(list[i]);
    for (let d = 1; d < list.length; d++) {
      const a = list[i - d], b = list[i + d];
      if (a?.img) return a.img;
      if (b?.img) return b.img;
    }
    return null;
  }

  still(key: string): Drawable | null {
    const e = this.byKey.get(key);
    if (!e) return null;
    if (!e.img && e.blob && !e.decoding) this.decode(e);
    return e.img ?? null;
  }

  chapterCount(chapter: string) {
    return this.byChapter.get(chapter)?.length ?? 0;
  }

  dispose() {
    this.disposed = true;
    this.abort.abort();
    for (const e of this.entries) this.release(e);
  }

  // ------------------------------------------------------------ internals
  private score(e: Entry) {
    if (e.still) return -1000 + e.g; // stills first, in film order
    const d = e.g - this.pos;
    let s = d >= 0 ? d : -d * 3; // ahead beats behind
    if (e.index % 8 === 0) s -= 60; // coarse pass first
    else if (e.index % 4 === 0) s -= 25;
    return s;
  }

  private pump() {
    if (this.disposed) return;
    while (this.fetching < FETCH_CONCURRENCY) {
      let best: Entry | null = null;
      let bs = Infinity;
      for (const e of this.entries) {
        if (e.blob || e.fetching || (e.failed ?? 0) > 2) continue;
        const s = this.score(e);
        if (s < bs) {
          bs = s;
          best = e;
        }
      }
      if (!best) break;
      this.fetch(best);
    }
    // decode window
    if (this.decoding < DECODE_CONCURRENCY) {
      const lo = this.pos - DECODE_BEHIND, hi = this.pos + DECODE_AHEAD;
      const wanted = this.entries
        .filter((e) => e.blob && !e.img && !e.decoding && (e.still || (e.g >= lo && e.g <= hi)))
        .sort((a, b) => Math.abs(a.g - this.pos) - Math.abs(b.g - this.pos));
      for (const e of wanted) {
        if (this.decoding >= DECODE_CONCURRENCY) break;
        this.decode(e);
      }
    }
  }

  private async fetch(e: Entry) {
    e.fetching = true;
    this.fetching++;
    try {
      const res = await fetch(e.url, { signal: this.abort.signal });
      if (!res.ok) throw new Error(String(res.status));
      e.blob = await res.blob();
    } catch {
      if (this.disposed) return;
      e.failed = (e.failed ?? 0) + 1;
    } finally {
      e.fetching = false;
      this.fetching--;
    }
    if (this.disposed) return;
    const near = e.still || Math.abs(e.g - this.pos) <= DECODE_AHEAD;
    if (near && e.blob) this.decode(e);
    this.pump();
  }

  private async decode(e: Entry) {
    if (!e.blob || e.img || e.decoding) return;
    e.decoding = true;
    this.decoding++;
    try {
      let img: Drawable;
      if (canBitmap) {
        img = await createImageBitmap(e.blob);
      } else {
        const el = new Image();
        el.decoding = "async";
        el.src = URL.createObjectURL(e.blob);
        await el.decode();
        img = el;
      }
      if (this.disposed) {
        if ("close" in img) img.close();
        return;
      }
      e.img = img;
      if (e.still || Math.abs(e.g - this.pos) <= DECODE_AHEAD + 2) this.opts.onUpdate();
      this.checkBoot();
    } catch {
      e.blob = undefined; // refetch
      e.failed = (e.failed ?? 0) + 1;
    } finally {
      e.decoding = false;
      this.decoding--;
      this.pump();
    }
  }

  private checkBoot() {
    if (this.bootDone) return;
    const keys = this.opts.bootKeys;
    const ready = keys.filter((k) => this.byKey.get(k)?.img).length;
    this.opts.onBootProgress?.(keys.length ? ready / keys.length : 1);
    if (ready === keys.length) this.bootDone = true;
  }

  private release(e: Entry) {
    if (!e.img) return;
    if ("close" in e.img) e.img.close();
    else if (e.img.src.startsWith("blob:")) URL.revokeObjectURL(e.img.src);
    e.img = undefined;
  }

  private evict() {
    const lo = this.pos - KEEP_BEHIND, hi = this.pos + KEEP_AHEAD;
    for (const e of this.entries) {
      if (!e.still && e.img && (e.g < lo || e.g > hi)) {
        // keep every 8th frame decoded per chapter as a cheap fallback layer
        if (e.index % 8 === 0 && this.decodedCoarse() < 12) continue;
        this.release(e);
      }
    }
  }

  private decodedCoarse() {
    let n = 0;
    for (const e of this.entries) if (!e.still && e.img && e.index % 8 === 0) n++;
    return n;
  }
}
