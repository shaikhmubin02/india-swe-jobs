// Board data model. Field names deliberately mirror the reference site
// (sector / level / discipline / focus / locations / source_posted / first_seen /
// is_open / popular_rank / trending_rank / trending) so the architecture is
// directly comparable, with India-specific fields added:
//   cities      - canonical city slugs for the city facet
//   work_mode   - onsite | hybrid | remote | unknown
//   walk_in     - walk-in interview / hiring event
//   event_type  - walk-in | hiring-event | campus-drive | null
//   track       - engineering | product | business

export type Level = "internship" | "program" | "graduate" | "experienced" | "unknown";
export type Discipline =
  | "software" | "data" | "ml" | "infra" | "security" | "quant" | "research" | "product" | "other";
export type Focus =
  | "low-latency" | "ml-ai" | "data" | "security" | "backend" | "frontend" | "fullstack"
  | "mobile" | "platform" | "systems" | "hardware" | "support" | "quant" | "qa" | null;
export type WorkMode = "onsite" | "hybrid" | "remote" | "unknown";
export type EventType = "walk-in" | "hiring-event" | "campus-drive";
export type Sector = "quant" | "tech";
export type Category = "hft" | "quant-research" | "ai-lab" | "global-tech" | "indian-product" | "services";
export type Track = "engineering" | "product" | "business";

export interface Job {
  id: string;
  title: string;
  url: string;
  company: string;
  company_slug: string;
  sector: Sector;
  category: Category;
  level: Level;
  discipline: Discipline;
  focus: Focus;
  track: Track;
  work_mode: WorkMode;
  walk_in: boolean;
  event_type: EventType | null;
  locations: { slug: string; name: string; region: string | null }[];
  cities: string[];
  department: string | null;
  employment_type: string | null;
  source: { ats: string; token: string; key: string };
  source_board: string;
  source_posted: string | null;
  source_updated: string | null;
  first_seen: string;
  last_seen: string;
  is_open: boolean;
  popular_rank: number | null;
  trending_rank: number | null;
  trending: boolean;
}

export interface Company {
  slug: string;
  name: string;
  sector: Sector;
  category: Category;
  careers: string | null;
  ats: string;
  token: string;
  open: number;
  total: number;
  walk_ins: number;
  cities: string[];
  disciplines: string[];
}

export interface CityMeta {
  slug: string;
  name: string;
  region: string | null;
  open: number;
}

export interface Meta {
  generated_at: string;
  closed_retention_days: number;
  trending_window_days: number;
  counts: {
    total: number; open: number; open_engineering: number; closed: number; walk_ins: number;
    companies: number; sources: number;
  };
  tracks: Record<string, number>;
  cities: CityMeta[];
  facets: {
    levels: Level[];
    disciplines: Discipline[];
    focuses: NonNullable<Focus>[];
    work_modes: WorkMode[];
    event_types: EventType[];
    sectors: Sector[];
    categories: Category[];
    tracks: Track[];
  };
  sources: {
    key: string; name: string; sector: Sector; category: Category;
    error: string | null; rows: number; india: number;
  }[];
}

export interface FilterState {
  q: string;
  companies: string[];
  cities: string[];
  sectors: Sector[];
  categories: Category[];
  levels: Level[];
  disciplines: Discipline[];
  focuses: NonNullable<Focus>[];
  work_modes: WorkMode[];
  event_types: EventType[];
  tracks: Track[];
  walkInOnly: boolean;
  includeClosed: boolean;
  sort: SortKey;
  pageSize: number;
}

export type SortKey = "relevance" | "newest" | "oldest" | "company" | "popular" | "trending";
