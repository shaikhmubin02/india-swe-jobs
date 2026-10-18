"use client";

// Client-side persistence. Keys and shapes deliberately match the reference
// site so the behaviour is directly comparable:
//   saved-jobs  - array of job ids, capped at 200, schema-validated on read
//   theme       - "light" | "dark"
//   sidebar-w   - sidebar width in px
//   sort        - chosen sort key
//   closed      - whether closed roles are shown

export const SAVED_KEY = "saved-jobs";
export const SIDEBAR_KEY = "sidebar-w";
export const SORT_KEY = "sort";
export const CLOSED_KEY = "closed";
export const WALKIN_KEY = "walkin";
export const SIZE_KEY = "page-size";

export const SAVED_CAP = 200;

const ID_RE = /^[0-9a-f]{8,24}$/;

function read(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}
function write(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* quota / private mode */ }
}

// Schema-validate on read: anything that isn't a plausible job id is dropped.
export function loadSaved(): string[] {
  const raw = read(SAVED_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x) => typeof x === "string" && ID_RE.test(x)).slice(0, SAVED_CAP);
  } catch {
    return [];
  }
}

export function persistSaved(ids: string[]) {
  write(SAVED_KEY, JSON.stringify(ids.slice(0, SAVED_CAP)));
}

export function loadString(key: string, fallback: string): string {
  return read(key) ?? fallback;
}
export function loadBool(key: string, fallback: boolean): boolean {
  const v = read(key);
  return v === null ? fallback : v === "true";
}
export function loadNumber(key: string, fallback: number): number {
  const v = read(key);
  const n = v === null ? NaN : Number(v);
  return Number.isFinite(n) ? n : fallback;
}
export const savePref = write;

// ---------------------------------------------------------------------------
// Anonymous engagement beacons.
//
// Same two endpoints as the reference site, same sendBeacon + plain-string
// body. Fire-and-forget: failures are ignored.
// ---------------------------------------------------------------------------
export function beaconClick(id: string) {
  try { navigator.sendBeacon?.("/api/click", id); } catch { /* ignore */ }
}

export function beaconSave(id: string, saved: boolean) {
  try { navigator.sendBeacon?.("/api/save", `${saved ? "save" : "unsave"}:${id}`); } catch { /* ignore */ }
}

// ---------------------------------------------------------------------------
// Saved-jobs hook shared by the explorer and the /saved page.
// ---------------------------------------------------------------------------
import { useCallback, useEffect, useState } from "react";

export function useSavedJobs() {
  const [saved, setSaved] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSaved(loadSaved());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    persistSaved(saved);
  }, [saved, ready]);

  const toggle = useCallback((id: string) => {
    setSaved((prev) => {
      const has = prev.includes(id);
      const next = has ? prev.filter((x) => x !== id) : [id, ...prev].slice(0, SAVED_CAP);
      beaconSave(id, !has);
      return next;
    });
  }, []);

  const clear = useCallback(() => setSaved([]), []);

  return { saved, toggle, clear, ready };
}
