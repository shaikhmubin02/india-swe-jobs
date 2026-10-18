import { existsSync, readFileSync, writeFileSync, mkdirSync, renameSync } from "node:fs";
import { join } from "node:path";

// Aggregate engagement counters.
//
// The board's "most viewed" and "trending" orderings are baked in at build
// time, exactly like the reference site: the beacon endpoints accumulate counts
// continuously, and the next ingest reads them. On a static/edge deployment swap
// this file store for a KV namespace (Cloudflare KV, Upstash, Durable Object) --
// the read/write surface is the two functions below.
//
// Only aggregate counts are stored. No IPs, no user agents, no cookies.

const DATA = join(process.cwd(), "data");
const CLICKS_FILE = join(DATA, "clicks.json");
const SAVES_FILE = join(DATA, "saves.json");

type DayBuckets = Record<string, number>;
export type ClickRecord = { total: number; byDay: DayBuckets };
type Store = Record<string, ClickRecord>;

let cache: { clicks: Store; saves: Store } | null = null;
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function readStore(file: string): Store {
  try {
    if (!existsSync(file)) return {};
    const parsed = JSON.parse(readFileSync(file, "utf8"));
    return parsed && typeof parsed === "object" ? (parsed as Store) : {};
  } catch {
    return {};
  }
}

function load() {
  if (!cache) cache = { clicks: readStore(CLICKS_FILE), saves: readStore(SAVES_FILE) };
  return cache;
}

function flush() {
  if (!cache) return;
  try {
    if (!existsSync(DATA)) mkdirSync(DATA, { recursive: true });
    const tmp = CLICKS_FILE + ".tmp";
    writeFileSync(tmp, JSON.stringify(cache.clicks));
    renameSync(tmp, CLICKS_FILE);
    const tmp2 = SAVES_FILE + ".tmp";
    writeFileSync(tmp2, JSON.stringify(cache.saves));
    renameSync(tmp2, SAVES_FILE);
  } catch {
    // Read-only filesystem (e.g. a serverless deploy without KV wired up):
    // counts stay in memory for the life of the instance.
  }
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => { flushTimer = null; flush(); }, 5000);
}

const DAY = () => new Date().toISOString().slice(0, 10);

function bump(store: Store, id: string) {
  const rec = store[id] || (store[id] = { total: 0, byDay: {} });
  rec.total += 1;
  const d = DAY();
  rec.byDay[d] = (rec.byDay[d] || 0) + 1;
}

export function incrementClick(id: string) {
  bump(load().clicks, id);
  scheduleFlush();
}

export function incrementSave(id: string, saved: boolean) {
  // Saves are tracked the same way; unsaves only decrement the running total.
  const store = load().saves;
  if (saved) {
    bump(store, id);
  } else {
    const rec = store[id];
    if (rec && rec.total > 0) { rec.total -= 1; scheduleFlush(); }
  }
}

export function isJobId(v: unknown): v is string {
  return typeof v === "string" && /^[0-9a-f]{8,24}$/.test(v.trim());
}
