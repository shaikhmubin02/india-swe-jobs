"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Company, FilterState, Job, Meta, SortKey } from "@/lib/types";
import {
  CATEGORY_LABEL, DISCIPLINE_LABEL, EVENT_LABEL, FOCUS_LABEL, LEVEL_LABEL,
  SORTS, SECTOR_LABEL, TRACK_LABEL, WORK_MODE_LABEL, relativeTime,
} from "@/lib/taxonomy";
import {
  CLOSED_KEY, SIZE_KEY, SIDEBAR_KEY, SORT_KEY, WALKIN_KEY,
  loadBool, loadNumber, loadSaved,
  savePref, useSavedJobs, beaconClick,
} from "@/lib/store";

type FacetKey =
  | "companies" | "cities" | "sectors" | "categories" | "levels" | "disciplines"
  | "focuses" | "work_modes" | "event_types" | "tracks" | "walkInOnly";

const DEFAULT_FILTERS: FilterState = {
  q: "",
  companies: [],
  cities: [],
  sectors: [],
  categories: [],
  levels: [],
  disciplines: [],
  focuses: [],
  work_modes: [],
  event_types: [],
  tracks: ["engineering"],
  walkInOnly: false,
  includeClosed: false,
  sort: "newest",
  pageSize: 20,
};

function initials(name: string): string {
  const parts = name.replace(/[^\w\s&.-]/g, " ").split(/[\s&.-]+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function hueOf(slug: string): number {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) % 360;
  return h;
}

function jobValues(j: Job, key: FacetKey): string[] {
  switch (key) {
    case "companies": return [j.company_slug];
    case "cities": return j.cities;
    case "sectors": return [j.sector];
    case "categories": return [j.category];
    case "levels": return [j.level];
    case "disciplines": return [j.discipline];
    case "focuses": return j.focus ? [j.focus] : [];
    case "work_modes": return [j.work_mode];
    case "event_types": return j.event_type ? [j.event_type] : [];
    case "tracks": return [j.track];
    case "walkInOnly": return j.walk_in ? ["walk-in"] : [];
  }
}

function haystack(j: Job): string {
  return [
    j.title, j.company, j.department || "",
    ...j.cities, j.locations.map((l) => l.name).join(" "),
    LEVEL_LABEL[j.level], DISCIPLINE_LABEL[j.discipline],
    j.focus ? FOCUS_LABEL[j.focus] : "", CATEGORY_LABEL[j.category], SECTOR_LABEL[j.sector],
    j.work_mode,
  ].join(" ").toLowerCase();
}

const SEARCH_CACHE = new WeakMap<Job, string>();
function hay(j: Job): string {
  let h = SEARCH_CACHE.get(j);
  if (!h) { h = haystack(j); SEARCH_CACHE.set(j, h); }
  return h;
}

function matches(j: Job, f: FilterState, except?: FacetKey): boolean {
  if (!j.is_open && !f.includeClosed) return false;

  if (except !== "tracks" && f.tracks.length > 0 && !f.tracks.includes(j.track)) return false;
  if (except !== "walkInOnly" && f.walkInOnly && !j.walk_in) return false;

  const groups: [FacetKey, string[]][] = [
    ["companies", f.companies], ["cities", f.cities], ["sectors", f.sectors],
    ["categories", f.categories], ["levels", f.levels], ["disciplines", f.disciplines],
    ["focuses", f.focuses], ["work_modes", f.work_modes], ["event_types", f.event_types],
  ];
  for (const [key, selected] of groups) {
    if (key === except) continue;
    if (selected.length === 0) continue;
    const vals = jobValues(j, key);
    if (!vals.some((v) => selected.includes(v))) return false;
  }

  if (f.q.trim()) {
    const tokens = f.q.toLowerCase().split(/\s+/).filter(Boolean);
    const h = hay(j);
    if (!tokens.every((t) => h.includes(t))) return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
function Facet({
  title, options, selected, onToggle, defaultOpen = true, showMoreAfter = 8, searchable = false,
}: {
  title: string;
  options: { value: string; label: string; count: number }[];
  selected: string[];
  onToggle: (v: string) => void;
  defaultOpen?: boolean;
  showMoreAfter?: number;
  searchable?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const list = searchable && query
      ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
      : options;
    return expanded ? list : list.slice(0, showMoreAfter);
  }, [options, expanded, showMoreAfter, query, searchable]);

  const activeCount = selected.length;
  if (options.length === 0) return null;

  return (
    <div className={`facet${open ? " open" : ""}${open ? "" : " hidden-body"}`}>
      <button className="facet-toggle" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className="facet-caret">▶</span>
        {title}
        {activeCount > 0 && <span className="facet-count">{activeCount}</span>}
      </button>
      <div className="facet-body">
        {searchable && options.length > showMoreAfter && (
          <div className="search-wrap" style={{ marginBottom: 7 }}>
            <input
              className="search-input"
              style={{ padding: "6px 9px", fontSize: 13 }}
              placeholder={`Filter ${title.toLowerCase()}…`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        )}
        {visible.map((o) => (
          <label className="check" key={o.value}>
            <input
              type="checkbox"
              checked={selected.includes(o.value)}
              onChange={() => onToggle(o.value)}
            />
            <span className="check-label" title={o.label}>{o.label}</span>
            <span className="check-n">{o.count}</span>
          </label>
        ))}
        {!expanded && options.length > showMoreAfter && (
          <button className="facet-more" onClick={() => setExpanded(true)}>
            Show all {options.length}
          </button>
        )}
        {expanded && options.length > showMoreAfter && (
          <button className="facet-more" onClick={() => setExpanded(false)}>Show less</button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
export interface ExplorerProps {
  jobs: Job[];
  companies: Company[];
  meta: Meta;
  heading: string;
  subheading?: string;
  initial?: Partial<FilterState>;
  emptyTitle?: string;
  emptyHint?: string;
}

export function Explorer({
  jobs, companies, meta, heading, subheading, initial, emptyTitle, emptyHint,
}: ExplorerProps) {
  const [filters, setFilters] = useState<FilterState>(() => ({ ...DEFAULT_FILTERS, ...initial }));
  // Frozen snapshot of the page's own defaults. Filters that came from the page
  // (e.g. /internships pinning level=internship) are the page's premise, not
  // "active filters" the visitor added, so they don't get a removable chip.
  const [baseline] = useState<FilterState>(() => ({ ...DEFAULT_FILTERS, ...initial }));
  const [page, setPage] = useState(1);
  const [sidebarW, setSidebarW] = useState(268);
  const [hydrated, setHydrated] = useState(false);
  const { saved, toggle: toggleSave } = useSavedJobs();
  const savedSet = useMemo(() => new Set(saved), [saved]);
  const dragRef = useRef<{ startX: number; startW: number } | null>(null);

  // Restore preferences from the same localStorage keys the reference uses.
  useEffect(() => {
    setFilters((f) => ({
      ...f,
      sort: loadNumber(SORT_KEY, 0) ? f.sort : f.sort,
      includeClosed: loadBool(CLOSED_KEY, f.includeClosed),
      pageSize: loadNumber(SIZE_KEY, f.pageSize),
      walkInOnly: loadBool(WALKIN_KEY, f.walkInOnly),
    }));
    try {
      const s = localStorage.getItem(SORT_KEY);
      if (s) setFilters((f) => ({ ...f, sort: s as SortKey }));
    } catch { /* ignore */ }
    const w = loadNumber(SIDEBAR_KEY, 268);
    setSidebarW(Math.min(460, Math.max(220, w)));
    setHydrated(true);
  }, []);

  useEffect(() => { setPage(1); }, [filters]);

  useEffect(() => {
    if (!hydrated) return;
    savePref(SORT_KEY, filters.sort);
    savePref(CLOSED_KEY, String(filters.includeClosed));
    savePref(SIZE_KEY, String(filters.pageSize));
    savePref(WALKIN_KEY, String(filters.walkInOnly));
  }, [filters.sort, filters.includeClosed, filters.pageSize, filters.walkInOnly, hydrated]);

  const onResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragRef.current = { startX: e.clientX, startW: sidebarW };
    const move = (ev: MouseEvent) => {
      const d = dragRef.current;
      if (!d) return;
      const next = Math.min(460, Math.max(220, d.startW + (ev.clientX - d.startX)));
      setSidebarW(next);
    };
    const up = () => {
      dragRef.current = null;
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
      setSidebarW((w) => { savePref(SIDEBAR_KEY, String(w)); return w; });
    };
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
  }, [sidebarW]);

  const toggleIn = useCallback((key: FacetKey, value: string) => {
    setFilters((f) => {
      const arr = f[key] as string[];
      const next = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
      return { ...f, [key]: next } as FilterState;
    });
  }, []);

  const matched = useMemo(() => jobs.filter((j) => matches(j, filters)), [jobs, filters]);

  const sorted = useMemo(() => {
    const list = [...matched];
    const byPosted = (a: Job, b: Job) => {
      const ta = a.source_posted ? Date.parse(a.source_posted) : 0;
      const tb = b.source_posted ? Date.parse(b.source_posted) : 0;
      return tb - ta;
    };
    switch (filters.sort) {
      case "newest": list.sort((a, b) => byPosted(a, b) || Date.parse(b.first_seen) - Date.parse(a.first_seen)); break;
      case "oldest": list.sort((a, b) => byPosted(b, a) || Date.parse(a.first_seen) - Date.parse(b.first_seen)); break;
      case "relevance": list.sort((a, b) => a.company.localeCompare(b.company) || a.title.localeCompare(b.title)); break;
      case "company": {
        const counts = new Map<string, number>();
        for (const j of list) counts.set(j.company_slug, (counts.get(j.company_slug) || 0) + 1);
        list.sort((a, b) => (counts.get(b.company_slug)! - counts.get(a.company_slug)!) || a.company.localeCompare(b.company) || byPosted(a, b));
        break;
      }
      case "popular": list.sort((a, b) => (a.popular_rank ?? 1e9) - (b.popular_rank ?? 1e9) || byPosted(a, b)); break;
      case "trending": list.sort((a, b) => (a.trending_rank ?? 1e9) - (b.trending_rank ?? 1e9) || byPosted(a, b)); break;
    }
    return list;
  }, [matched, filters.sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / filters.pageSize));
  const safePage = Math.min(page, totalPages);
  const slice = sorted.slice((safePage - 1) * filters.pageSize, safePage * filters.pageSize);

  // ---- facet option sets ---------------------------------------------------
  const cityOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const j of jobs) {
      if (!j.is_open && !filters.includeClosed) continue;
      if (!matches(j, filters, "cities")) continue;
      for (const c of j.cities) counts.set(c, (counts.get(c) || 0) + 1);
    }
    const nameOf = new Map(meta.cities.map((c) => [c.slug, c.name]));
    return [...counts.entries()]
      .map(([value, count]) => ({ value, label: nameOf.get(value) || value, count }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  }, [jobs, filters, meta.cities]);

  const companyOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const j of jobs) {
      if (!j.is_open && !filters.includeClosed) continue;
      if (!matches(j, filters, "companies")) continue;
      counts.set(j.company_slug, (counts.get(j.company_slug) || 0) + 1);
    }
    const nameOf = new Map(companies.map((c) => [c.slug, c.name]));
    return [...counts.entries()]
      .map(([value, count]) => ({ value, label: nameOf.get(value) || value, count }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  }, [jobs, filters, companies]);

  const enumOptions = useCallback(
    (key: FacetKey, labels: Record<string, string>, order?: string[]) => {
      const counts = new Map<string, number>();
      for (const j of jobs) {
        if (!j.is_open && !filters.includeClosed) continue;
        if (!matches(j, filters, key)) continue;
        for (const v of jobValues(j, key)) counts.set(v, (counts.get(v) || 0) + 1);
      }
      const keys = order || [...counts.keys()];
      return keys
        .filter((k) => counts.has(k))
        .map((value) => ({ value, label: labels[value] || value, count: counts.get(value)! }));
    },
    [jobs, filters],
  );

  const cityLabel = (slug: string) => meta.cities.find((c) => c.slug === slug)?.name || slug;

  const activeChips: { label: string; clear: () => void }[] = [];
  const baseIncludes = (key: FacetKey, value: string) => {
    const v = baseline[key] as unknown;
    return Array.isArray(v) && (v as string[]).includes(value);
  };
  const addChip = (key: FacetKey, value: string, label: string) => {
    if (baseIncludes(key, value)) return;
    activeChips.push({ label, clear: () => toggleIn(key, value) });
  };

  for (const c of filters.companies) addChip("companies", c, companies.find((x) => x.slug === c)?.name || c);
  for (const c of filters.cities) addChip("cities", c, cityLabel(c));
  for (const c of filters.levels) addChip("levels", c, LEVEL_LABEL[c as never] || c);
  for (const c of filters.disciplines) addChip("disciplines", c, DISCIPLINE_LABEL[c as never] || c);
  for (const c of filters.focuses) addChip("focuses", c, FOCUS_LABEL[c as never] || c);
  for (const c of filters.work_modes) addChip("work_modes", c, WORK_MODE_LABEL[c as never] || c);
  for (const c of filters.event_types) addChip("event_types", c, EVENT_LABEL[c as never] || c);
  for (const c of filters.sectors) addChip("sectors", c, SECTOR_LABEL[c as never] || c);
  for (const c of filters.categories) addChip("categories", c, CATEGORY_LABEL[c as never] || c);
  for (const c of filters.tracks) addChip("tracks", c, TRACK_LABEL[c as never] || c);
  if (filters.walkInOnly && !baseline.walkInOnly) {
    activeChips.push({ label: "Walk-in only", clear: () => setFilters((f) => ({ ...f, walkInOnly: false })) });
  }

  const resetAll = () => setFilters({ ...DEFAULT_FILTERS, ...initial });

  return (
    <div className="shell">
      <div className="layout">
        <aside className="sidebar" style={{ width: sidebarW, ["--sidebar-w" as string]: `${sidebarW}px` }} id="filters">
          <div className="panel">
            <div className="panel-body">
              <div className="search-wrap">
                <span className="search-icon">⌕</span>
                <input
                  className="search-input"
                  placeholder="Search title, company, city…"
                  value={filters.q}
                  onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
                  aria-label="Search roles"
                />
                {filters.q && (
                  <button className="search-clear" onClick={() => setFilters((f) => ({ ...f, q: "" }))} aria-label="Clear search">✕</button>
                )}
              </div>
            </div>
          </div>

          <div className="panel" style={{ marginTop: 12 }}>
            <div className="panel-head">
              Filters
              {activeChips.length > 0 && (
                <button className="chip-btn" onClick={resetAll}>Clear all</button>
              )}
            </div>

            {cityOptions.length > 0 && (
              <Facet title="City" options={cityOptions} selected={filters.cities} onToggle={(v) => toggleIn("cities", v)} showMoreAfter={10} />
            )}
            <Facet title="Company" options={companyOptions} selected={filters.companies} onToggle={(v) => toggleIn("companies", v)} showMoreAfter={10} searchable />
            <Facet title="Sector" options={enumOptions("sectors", SECTOR_LABEL, ["quant", "tech"])} selected={filters.sectors} onToggle={(v) => toggleIn("sectors", v)} defaultOpen={false} />
            <Facet title="Company type" options={enumOptions("categories", CATEGORY_LABEL, ["hft", "quant-research", "ai-lab", "global-tech", "indian-product", "services"])} selected={filters.categories} onToggle={(v) => toggleIn("categories", v)} />
            <Facet title="Level" options={enumOptions("levels", LEVEL_LABEL, ["internship", "graduate", "program", "experienced", "unknown"])} selected={filters.levels} onToggle={(v) => toggleIn("levels", v)} />
            <Facet title="Discipline" options={enumOptions("disciplines", DISCIPLINE_LABEL)} selected={filters.disciplines} onToggle={(v) => toggleIn("disciplines", v)} />
            <Facet title="Focus" options={enumOptions("focuses", FOCUS_LABEL)} selected={filters.focuses} onToggle={(v) => toggleIn("focuses", v)} defaultOpen={false} showMoreAfter={7} />
            <Facet title="Work mode" options={enumOptions("work_modes", WORK_MODE_LABEL, ["onsite", "hybrid", "remote", "unknown"])} selected={filters.work_modes} onToggle={(v) => toggleIn("work_modes", v)} defaultOpen={false} />
            <Facet title="Hiring event" options={enumOptions("event_types", EVENT_LABEL, ["walk-in", "hiring-event", "campus-drive"])} selected={filters.event_types} onToggle={(v) => toggleIn("event_types", v)} defaultOpen={false} />
            {meta.tracks.product > 0 && (
              <Facet title="Role track" options={enumOptions("tracks", TRACK_LABEL, ["engineering", "product"])} selected={filters.tracks} onToggle={(v) => toggleIn("tracks", v)} defaultOpen={false} />
            )}
          </div>
        </aside>

        <div className="resizer" onMouseDown={onResizeStart} title="Drag to resize" />

        <main className="main">
          <h1 className="page-title">{heading}</h1>
          {subheading && <p className="page-sub">{subheading}</p>}

          {activeChips.length > 0 && (
            <div className="badge-row" style={{ marginBottom: 12 }}>
              {activeChips.map((c, i) => (
                <button key={`${c.label}-${i}`} className="chip-btn on" onClick={c.clear} title="Remove filter">
                  {c.label} ✕
                </button>
              ))}
            </div>
          )}

          <div className="panel">
            <div className="toolbar">
              <span className="toolbar-title">
                {sorted.length.toLocaleString()} {sorted.length === 1 ? "role" : "roles"}
              </span>
              <span className="toolbar-sub">
                {filters.includeClosed ? "including closed" : "open roles"}
              </span>
              <div className="toolbar-right">
                <button
                  className={`chip-btn walkin${filters.walkInOnly ? " on" : ""}`}
                  onClick={() => setFilters((f) => ({ ...f, walkInOnly: !f.walkInOnly }))}
                  title="Walk-in interviews and hiring events only"
                >
                  Walk-in interviews
                </button>
                <button
                  className={`chip-btn${filters.includeClosed ? " on" : ""}`}
                  onClick={() => setFilters((f) => ({ ...f, includeClosed: !f.includeClosed }))}
                >
                  View closed roles
                </button>
                <select
                  className="select"
                  value={filters.sort}
                  onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value as SortKey }))}
                  aria-label="Sort"
                >
                  {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
                <select
                  className="select"
                  value={filters.pageSize}
                  onChange={(e) => setFilters((f) => ({ ...f, pageSize: Number(e.target.value) }))}
                  aria-label="Rows per page"
                >
                  {[20, 50, 100].map((n) => <option key={n} value={n}>{n} / page</option>)}
                </select>
              </div>
            </div>

            {slice.length === 0 ? (
              <div className="empty">
                <div className="empty-big">{emptyTitle || "No roles match these filters"}</div>
                <div>{emptyHint || "Try removing a filter or clearing the search box."}</div>
                <div style={{ marginTop: 12 }}>
                  <button className="chip-btn" onClick={resetAll}>Clear all filters</button>
                </div>
              </div>
            ) : (
              <div className="job-list">
                {slice.map((j) => {
                  const hue = hueOf(j.company_slug);
                  return (
                    <article className={`job${j.is_open ? "" : " closed"}`} key={j.id}>
                      <div
                        className="logo"
                        style={{ color: `hsl(${hue} 45% 38%)`, background: `hsl(${hue} 45% 96%)` }}
                        aria-hidden
                      >
                        {initials(j.company)}
                      </div>
                      <div className="job-main">
                        <div className="job-title-row">
                          <a
                            className="job-title"
                            href={j.url}
                            target="_blank"
                            rel="noopener noreferrer nofollow"
                            onClick={() => beaconClick(j.id)}
                          >
                            {j.title}
                          </a>
                          <Link className="job-co" href={`/companies/${j.company_slug}`}>{j.company}</Link>
                        </div>
                        <div className="job-meta">
                          {j.walk_in && j.event_type && (
                            <span className="tag walkin">● {EVENT_LABEL[j.event_type]}</span>
                          )}
                          <span className={`tag level${j.sector === "quant" ? " quant" : ""}`}>
                            {LEVEL_LABEL[j.level]}
                          </span>
                          <span className="tag">{DISCIPLINE_LABEL[j.discipline]}</span>
                          {j.focus && FOCUS_LABEL[j.focus] !== DISCIPLINE_LABEL[j.discipline] && (
                            <span className="tag">{FOCUS_LABEL[j.focus]}</span>
                          )}
                          {j.work_mode === "remote" && <span className="tag remote">Remote</span>}
                          {j.work_mode === "hybrid" && <span className="tag">Hybrid</span>}
                          {j.cities.slice(0, 3).map((c) => (
                            <span className="tag city" key={c}>📍 {cityLabel(c)}</span>
                          ))}
                          {j.cities.length > 3 && <span className="tag city">+{j.cities.length - 3}</span>}
                          {!j.is_open && <span className="tag closed">Closed</span>}
                          {j.trending && <span className="tag">▲ Trending</span>}
                        </div>
                      </div>
                      <div className="job-side">
                        <span className="job-when" title={j.source_posted || ""}>
                          {relativeTime(j.source_posted || j.first_seen)}
                        </span>
                        <button
                          className={`save-btn${savedSet.has(j.id) ? " on" : ""}`}
                          onClick={() => toggleSave(j.id)}
                          aria-pressed={savedSet.has(j.id)}
                        >
                          {savedSet.has(j.id) ? "★ Saved" : "☆ Save"}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {totalPages > 1 && (
              <nav className="pager" aria-label="Pagination">
                <button onClick={() => setPage(1)} disabled={safePage === 1} aria-label="First page">«</button>
                <button onClick={() => setPage(safePage - 1)} disabled={safePage === 1}>Prev</button>
                {pageWindow(safePage, totalPages).map((p, i) =>
                  p === "…" ? (
                    <span key={`g${i}`} style={{ color: "var(--faint)", padding: "0 4px" }}>…</span>
                  ) : (
                    <button key={p} className={p === safePage ? "on" : ""} onClick={() => setPage(p as number)}>{p}</button>
                  ),
                )}
                <button onClick={() => setPage(safePage + 1)} disabled={safePage === totalPages}>Next</button>
                <button onClick={() => setPage(totalPages)} disabled={safePage === totalPages} aria-label="Last page">»</button>
              </nav>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function pageWindow(current: number, total: number): (number | "…")[] {
  const out: (number | "…")[] = [];
  const push = (n: number | "…") => out.push(n);
  const around = 2;
  for (let p = 1; p <= total; p++) {
    if (p === 1 || p === total || Math.abs(p - current) <= around) push(p);
    else if (out[out.length - 1] !== "…") push("…");
  }
  return out;
}
