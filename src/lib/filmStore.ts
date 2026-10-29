"use client";

import { useSyncExternalStore } from "react";

/** Film state shared between the canvas stage and the chrome (pill, rail, dock, nav). */
interface FilmState {
  chapter: number;
  /** true while the drawer or another overlay owns the screen */
  scrollTarget: ((chapter: number) => void) | null;
  inFilm: boolean;
}

let state: FilmState = { chapter: 0, scrollTarget: null, inFilm: true };
const subs = new Set<() => void>();

export const filmStore = {
  get: () => state,
  set(patch: Partial<FilmState>) {
    const next = { ...state, ...patch };
    if (next.chapter === state.chapter && next.scrollTarget === state.scrollTarget && next.inFilm === state.inFilm) return;
    state = next;
    subs.forEach((f) => f());
  },
  subscribe(f: () => void) {
    subs.add(f);
    return () => subs.delete(f);
  },
};

export function useFilm<T>(select: (s: FilmState) => T): T {
  return useSyncExternalStore(
    filmStore.subscribe,
    () => select(filmStore.get()),
    () => select({ chapter: 0, scrollTarget: null, inFilm: true }),
  );
}
