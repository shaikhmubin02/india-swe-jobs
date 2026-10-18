import type { Category, Discipline, EventType, Focus, Level, Sector, Track, WorkMode } from "./types";

export const LEVEL_LABEL: Record<Level, string> = {
  internship: "Internship",
  program: "Graduate programme",
  graduate: "New grad / fresher",
  experienced: "Experienced",
  unknown: "Unspecified",
};

export const DISCIPLINE_LABEL: Record<Discipline, string> = {
  software: "Software engineering",
  data: "Data",
  ml: "ML / AI",
  infra: "Infrastructure",
  security: "Security",
  quant: "Quant / trading",
  research: "Research",
  product: "Product & programme",
  other: "Other",
};

export const FOCUS_LABEL: Record<NonNullable<Focus>, string> = {
  "low-latency": "Low latency / HFT",
  "ml-ai": "ML / AI",
  data: "Data",
  security: "Security",
  backend: "Backend",
  frontend: "Frontend",
  fullstack: "Full stack",
  mobile: "Mobile",
  platform: "Platform / DevOps",
  systems: "Systems",
  hardware: "Hardware",
  support: "Solutions / support",
  quant: "Quant",
  qa: "QA / test",
};

export const WORK_MODE_LABEL: Record<WorkMode, string> = {
  onsite: "On-site",
  hybrid: "Hybrid",
  remote: "Remote",
  unknown: "Unspecified",
};

export const SECTOR_LABEL: Record<Sector, string> = {
  quant: "Quant / HFT",
  tech: "Tech",
};

export const CATEGORY_LABEL: Record<Category, string> = {
  hft: "HFT / prop trading",
  "quant-research": "Quant research",
  "ai-lab": "AI lab",
  "global-tech": "Global tech / GCC",
  "indian-product": "Indian product",
  services: "IT services",
};

export const EVENT_LABEL: Record<EventType, string> = {
  "walk-in": "Walk-in interview",
  "hiring-event": "Hiring event",
  "campus-drive": "Campus / off-campus drive",
};

export const TRACK_LABEL: Record<Track, string> = {
  engineering: "Engineering",
  product: "Product & programme",
  business: "Business",
};

export const SORTS: { key: string; label: string }[] = [
  { key: "newest", label: "Newest first" },
  { key: "oldest", label: "Oldest first" },
  { key: "relevance", label: "Company A–Z" },
  { key: "company", label: "Most roles per company" },
  { key: "popular", label: "Most viewed" },
  { key: "trending", label: "Trending this week" },
];

// ---------------------------------------------------------------------------
// formatting
// ---------------------------------------------------------------------------
export function relativeTime(iso: string | null): string {
  if (!iso) return "date unknown";
  const ms = Date.now() - Date.parse(iso);
  if (Number.isNaN(ms)) return "date unknown";
  const days = Math.floor(ms / 86400_000);
  if (days < 0) return "scheduled";
  if (days === 0) {
    const hours = Math.floor(ms / 3600_000);
    return hours <= 0 ? "just now" : `${hours}h ago`;
  }
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export function isoDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toISOString().slice(0, 10);
}

export function plural(n: number, one: string, many?: string): string {
  return n === 1 ? one : many || `${one}s`;
}
