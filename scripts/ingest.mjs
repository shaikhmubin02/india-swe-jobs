// Ingest: fetch every configured source, normalise to the board's job schema,
// keep only India postings, classify, and write the static data set.
//
// Mirrors the reference architecture: there is no runtime jobs API. The whole
// data set is materialised to data/jobs.json at build time and embedded into
// the RSC payload of every listing page.
//
//   node scripts/ingest.mjs            # full run
//   node scripts/ingest.mjs --dry      # fetch + report, do not write
//   node scripts/ingest.mjs --only=imc,stripe
//
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SOURCES, sourceKey } from "./sources.mjs";
import { parseLocations, COUNTRY_RE, CITY_BY_SLUG, CITY_ORDER } from "./cities.mjs";
import { classifyPosting } from "./classify.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const DATA = join(ROOT, "data");

const args = process.argv.slice(2);
const DRY = args.includes("--dry");
const FRESH = args.includes("--fresh"); // ignore previous run: no closed-role carry-forward
const ONLY = (args.find((a) => a.startsWith("--only=")) || "").replace("--only=", "").split(",").filter(Boolean);

const CLOSED_RETENTION_DAYS = 30; // closed roles stay listed, greyed out, then drop
const TRENDING_WINDOW_DAYS = 7;
const UA = "india-swe-jobs/0.1 (+https://github.com/; job aggregation; contact: local)";

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function decodeEntities(s) {
  return String(s || "")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ").replace(/&mdash;/g, "-").replace(/&ndash;/g, "-")
    .replace(/&rsquo;/g, "'").replace(/&lsquo;/g, "'")
    .replace(/&ldquo;/g, '"').replace(/&rdquo;/g, '"')
    .replace(/&hellip;/g, "...").replace(/&bull;/g, "-").replace(/&#x2F;/g, "/")
    .replace(/&amp;/g, "&");
}

function stripTags(html) {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6]|tr)>/gi, "\n")
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function toText(raw) {
  return stripTags(decodeEntities(raw));
}

function iso(v) {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function hashId(...parts) {
  return createHash("sha1").update(parts.join("\u0000")).digest("hex").slice(0, 16);
}

function slugify(s) {
  return String(s || "").toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function getPath(obj, path) {
  return String(path || "").split(".").filter(Boolean).reduce((o, k) => (o == null ? o : o[k]), obj);
}

async function fetchJson(url, { retries = 2, timeout = 25000 } = {}) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), timeout);
    try {
      const res = await fetch(url, { headers: { "user-agent": UA, accept: "application/json" }, signal: c.signal });
      if (res.status === 404) return { error: "HTTP 404" };
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return { json: await res.json() };
    } catch (e) {
      if (attempt === retries) return { error: String(e.message || e) };
      await sleep(400 * (attempt + 1));
    } finally {
      clearTimeout(t);
    }
  }
  return { error: "unreachable" };
}

async function fetchText(url, { retries = 1, timeout = 25000 } = {}) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), timeout);
    try {
      const res = await fetch(url, { headers: { "user-agent": UA }, signal: c.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return { text: await res.text() };
    } catch (e) {
      if (attempt === retries) return { error: String(e.message || e) };
      await sleep(400 * (attempt + 1));
    } finally {
      clearTimeout(t);
    }
  }
  return { error: "unreachable" };
}

// ---------------------------------------------------------------------------
// adapters -> { externalId, title, url, location, description, posted, extra }
// ---------------------------------------------------------------------------
const adapters = {
  async greenhouse(src) {
    const { json, error } = await fetchJson(
      `https://boards-api.greenhouse.io/v1/boards/${src.token}/jobs?content=true`,
    );
    if (error) return { error };
    return {
      rows: (json.jobs || []).map((j) => ({
        externalId: String(j.id),
        title: j.title,
        url: j.absolute_url,
        location: j.location?.name || "",
        allLocations: (j.offices || []).map((o) => o.name).filter(Boolean),
        description: toText(j.content),
        posted: iso(j.first_published || j.updated_at),
        updated: iso(j.updated_at),
        department: (j.departments || []).map((d) => d.name).filter(Boolean).join(", ") || null,
      })),
    };
  },

  async ashby(src) {
    const { json, error } = await fetchJson(`https://api.ashbyhq.com/posting-api/job-board/${src.token}`);
    if (error) return { error };
    return {
      rows: (json.jobs || [])
        .filter((j) => j.isListed !== false)
        .map((j) => {
          const secondary = (j.secondaryLocations || []).map((s) => s.location).filter(Boolean);
          return {
            externalId: String(j.id),
            title: j.title,
            url: j.jobUrl || j.applyUrl,
            location: [j.location, ...secondary].filter(Boolean).join("; "),
            allLocations: secondary,
            description: toText(j.descriptionPlain || j.descriptionHtml),
            posted: iso(j.publishedAt),
            updated: iso(j.publishedAt),
            department: [j.department, j.team].filter(Boolean).join(", ") || null,
            employmentType: j.employmentType || null,
            remoteFlag: j.isRemote === true || j.workplaceType === "Remote",
          };
        }),
    };
  },

  async lever(src) {
    const { json, error } = await fetchJson(`https://api.lever.co/v0/postings/${src.token}?mode=json`);
    if (error) return { error };
    return {
      rows: (json || []).map((j) => {
        const all = j.categories?.allLocations || [];
        const loc = j.categories?.location || "";
        return {
          externalId: String(j.id),
          title: j.text,
          url: j.hostedUrl || j.applyUrl,
          location: [loc, ...all.filter((x) => x !== loc)].filter(Boolean).join("; "),
          allLocations: all,
          description: toText(j.descriptionPlain || j.description),
          posted: iso(j.createdAt),
          updated: iso(j.createdAt),
          department: [j.categories?.team, j.categories?.department].filter(Boolean).join(", ") || null,
          employmentType: j.categories?.commitment || null,
          remoteFlag: j.workplaceType === "remote",
        };
      }),
    };
  },

  async manual(src) {
    const file = join(DATA, "manual-jobs.json");
    if (!existsSync(file)) return { rows: [] };
    const list = JSON.parse(readFileSync(file, "utf8"));
    return {
      rows: list.map((j, i) => ({
        externalId: String(j.id || `manual-${i + 1}`),
        title: j.title,
        url: j.url,
        location: j.location || "India",
        allLocations: j.allLocations || [],
        description: toText(j.description || ""),
        posted: iso(j.posted) || new Date().toISOString(),
        updated: iso(j.posted) || new Date().toISOString(),
        department: j.department || null,
        employmentType: j.employmentType || null,
        forceEventType: j.event_type || (j.walk_in ? "walk-in" : null),
        forceCompany: j.company,
        forceCompanySlug: j.company_slug,
        forceWalkIn: !!j.walk_in,
      })),
    };
  },

  async json(src) {
    const { json, error } = await fetchJson(src.url);
    if (error) return { error };
    const m = src.jsonMap || {};
    const items = getPath(json, m.items || "") || [];
    return {
      rows: (Array.isArray(items) ? items : []).map((item, i) => ({
        externalId: String(getPath(item, m.id || "id") ?? i),
        title: getPath(item, m.title || "title"),
        url: getPath(item, m.url || "url"),
        location: getPath(item, m.location || "location") || "",
        allLocations: [],
        description: toText(getPath(item, m.description || "description") || ""),
        posted: iso(getPath(item, m.posted || "posted")),
        updated: iso(getPath(item, m.posted || "posted")),
        department: getPath(item, m.department || "department") || null,
      })).filter((r) => r.title && r.url),
    };
  },

  async rss(src) {
    const { text, error } = await fetchText(src.url);
    if (error) return { error };
    const m = src.rssMap || {};
    const blocks = text.match(/<(item|entry)\b[\s\S]*?<\/\1>/gi) || [];
    const pick = (block, tag) => {
      if (!tag) return null;
      const r = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
      const mt = block.match(r);
      if (!mt) return null;
      return toText(mt[1].replace(/<!\[CDATA\[|\]\]>/g, ""));
    };
    return {
      rows: blocks.map((b, i) => {
        const linkAttr = b.match(/<link[^>]*href="([^"]+)"/i);
        return {
          externalId: String(pick(b, m.id || "guid") || `rss-${i + 1}`),
          title: pick(b, m.title || "title"),
          url: linkAttr ? linkAttr[1] : pick(b, m.link || "link"),
          location: pick(b, m.location || "location") || (src.defaultLocation || "India"),
          allLocations: [],
          description: toText(pick(b, m.description || "description") || ""),
          posted: iso(pick(b, m.posted || "pubDate")),
          updated: iso(pick(b, m.posted || "pubDate")),
          department: null,
        };
      }).filter((r) => r.title && r.url),
    };
  },
};

// ---------------------------------------------------------------------------
// normalise one raw row into the board schema
// ---------------------------------------------------------------------------
// Synthesised pseudo-cities so the city facet accounts for every India role:
// country-wide remote postings, and postings that name India but no city.
const EXTRA_CITIES = {
  "remote-india": { slug: "remote-india", name: "Remote (India)", region: "Remote" },
  "india-anywhere": { slug: "india-anywhere", name: "India (multiple/unspecified)", region: null },
};

function normalise(src, row, now) {
  const cityInfo = parseLocations(row.location);
  const isIndia =
    cityInfo.isIndia ||
    (row.remoteFlag === true && COUNTRY_RE.test(row.location || "")) ||
    (row.remoteFlag === true && /india/i.test(row.location || ""));
  if (!isIndia) return null;

  const cls = classifyPosting({ title: row.title, description: row.description, location: row.location });

  const cities = [...cityInfo.cities];
  if (cities.length === 0) cities.push(cityInfo.remote || row.remoteFlag ? "remote-india" : "india-anywhere");

  const companyName = row.forceCompany || src.name;
  const companySlug = row.forceCompanySlug || src.slug;

  return {
    id: hashId(src.type, src.token || src.slug, row.externalId),
    title: String(row.title || "").trim(),
    url: row.url,
    company: companyName,
    company_slug: companySlug,
    sector: src.sector,
    category: src.category,
    level: cls.level,
    discipline: cls.discipline,
    focus: cls.focus,
    track: cls.track,
    work_mode: row.remoteFlag ? "remote" : cls.work_mode,
    walk_in: row.forceWalkIn || cls.walk_in,
    event_type: row.forceEventType || cls.event_type,
    locations: [{ slug: cityInfo.cities[0] || slugify(row.location) || "india", name: row.location || "India", region: cityInfo.cities[0] ? CITY_BY_SLUG.get(cityInfo.cities[0])?.region || null : null }],
    cities,
    department: row.department || null,
    employment_type: row.employmentType || null,
    source: { ats: src.type, token: src.token || src.slug, key: sourceKey(src) },
    source_board: `${src.type}:${src.token || src.slug}`,
    source_posted: row.posted,
    source_updated: row.updated,
    first_seen: now,
    last_seen: now,
    is_open: true,
    popular_rank: null,
    trending_rank: null,
    trending: false,
  };
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------
async function main() {
  if (!existsSync(DATA)) mkdirSync(DATA, { recursive: true });
  const now = new Date().toISOString();

  const previous = !FRESH && existsSync(join(DATA, "jobs.json"))
    ? JSON.parse(readFileSync(join(DATA, "jobs.json"), "utf8"))
    : [];
  const prevById = new Map(previous.map((j) => [j.id, j]));

  const clicks = existsSync(join(DATA, "clicks.json"))
    ? JSON.parse(readFileSync(join(DATA, "clicks.json"), "utf8"))
    : {};

  const sources = ONLY.length ? SOURCES.filter((s) => ONLY.includes(s.token) || ONLY.includes(s.slug)) : SOURCES;

  console.log(`ingesting ${sources.length} sources...\n`);
  const collected = [];
  const skipped = [];
  const report = [];

  const queue = [...sources];
  const workers = Array.from({ length: 6 }, async () => {
    while (queue.length) {
      const src = queue.shift();
      const adapter = adapters[src.type];
      if (!adapter) { report.push({ src, error: "no adapter" }); continue; }
      const out = await adapter(src);
      if (out.error) {
        report.push({ src, error: out.error, rows: 0, india: 0 });
        continue;
      }
      let india = 0;
      for (const row of out.rows) {
        const job = normalise(src, row, now);
        if (!job) continue; // not an India posting
        if (job.track === "business") { skipped.push(`${src.name}: ${row.title}`); continue; }
        india++;
        // preserve first_seen across runs
        const prev = prevById.get(job.id);
        if (prev?.first_seen) job.first_seen = prev.first_seen;
        collected.push(job);
      }
      report.push({ src, rows: out.rows.length, india });
      await sleep(60);
    }
  });
  await Promise.all(workers);

  // ---- dedupe by id (keep first) -----------------------------------------
  const byId = new Map();
  for (const j of collected) if (!byId.has(j.id)) byId.set(j.id, j);

  // ---- carry closed roles forward (retention window) ----------------------
  const cutoff = Date.now() - CLOSED_RETENTION_DAYS * 86400_000;
  let carried = 0;
  for (const prev of previous) {
    if (byId.has(prev.id)) continue;
    const last = Date.parse(prev.last_seen || prev.first_seen || 0);
    if (Number.isNaN(last) || last < cutoff) continue;
    byId.set(prev.id, { ...prev, is_open: false, walk_in: prev.walk_in, trending: false });
    carried++;
  }

  // ---- engagement ranks ---------------------------------------------------
  const dayKeys = Array.from({ length: TRENDING_WINDOW_DAYS }, (_, i) =>
    new Date(Date.now() - i * 86400_000).toISOString().slice(0, 10));
  const totals = [];
  for (const [jid, rec] of Object.entries(clicks)) {
    const total = typeof rec === "number" ? rec : rec.total || 0;
    const byDay = typeof rec === "object" && rec.byDay ? rec.byDay : {};
    const recent = dayKeys.reduce((n, d) => n + (byDay[d] || 0), 0);
    totals.push({ id: jid, total, recent });
  }
  totals.sort((a, b) => b.total - a.total);
  const popularRank = new Map(totals.map((t, i) => [t.id, i + 1]));
  const trending = totals.filter((t) => t.recent > 0).sort((a, b) => b.recent - a.recent);
  const trendingRank = new Map(trending.map((t, i) => [t.id, i + 1]));

  const jobs = [...byId.values()].map((j) => ({
    ...j,
    popular_rank: popularRank.get(j.id) ?? null,
    trending_rank: trendingRank.get(j.id) ?? null,
    trending: j.is_open && trendingRank.has(j.id),
  }));

  // ---- derived aggregates -------------------------------------------------
  const tracks = {};
  for (const j of jobs) tracks[j.track] = (tracks[j.track] || 0) + 1;

  const companies = new Map();
  for (const s of SOURCES) {
    if (s.type === "manual") continue;
    companies.set(s.slug, {
      slug: s.slug, name: s.name, sector: s.sector, category: s.category,
      careers: s.careers || null, ats: s.type, token: s.token,
      open: 0, total: 0, cities: new Set(), disciplines: new Set(), walk_ins: 0,
    });
  }
  // Companies that only appear via the curated feed (walk-in drives from firms
  // with no public board API) still need an entry so they get a company page.
  for (const j of jobs) {
    if (companies.has(j.company_slug)) continue;
    companies.set(j.company_slug, {
      slug: j.company_slug, name: j.company, sector: j.sector, category: "services",
      careers: null, ats: "manual", token: j.company_slug,
      open: 0, total: 0, cities: new Set(), disciplines: new Set(), walk_ins: 0,
    });
  }
  for (const j of jobs) {
    const c = companies.get(j.company_slug);
    if (!c) continue;
    c.total++;
    if (j.is_open) c.open++;
    if (j.walk_in && j.is_open) c.walk_ins++;
    j.cities.forEach((x) => c.cities.add(x));
    c.disciplines.add(j.discipline);
  }
  const companyList = [...companies.values()].map((c) => ({
    ...c,
    cities: CITY_ORDER.filter((x) => c.cities.has(x))
      .concat(["remote-india", "india-anywhere"].filter((x) => c.cities.has(x))),
    disciplines: [...c.disciplines].sort(),
  }));

  const open = jobs.filter((j) => j.is_open);
  const meta = {
    generated_at: now,
    closed_retention_days: CLOSED_RETENTION_DAYS,
    trending_window_days: TRENDING_WINDOW_DAYS,
    counts: {
      total: jobs.length,
      open: open.length,
      open_engineering: open.filter((j) => j.track === "engineering").length,
      closed: jobs.length - open.length,
      walk_ins: open.filter((j) => j.walk_in).length,
      companies: companyList.filter((c) => c.open > 0).length,
      sources: SOURCES.filter((s) => s.type !== "manual").length,
    },
    tracks,
    cities: [
      ...CITY_ORDER.map((slug) => ({
        slug, name: CITY_BY_SLUG.get(slug).name, region: CITY_BY_SLUG.get(slug).region,
        open: open.filter((j) => j.cities.includes(slug)).length,
      })),
      { slug: "remote-india", name: EXTRA_CITIES["remote-india"].name, region: "Remote", open: open.filter((j) => j.cities.includes("remote-india")).length },
      { slug: "india-anywhere", name: EXTRA_CITIES["india-anywhere"].name, region: null, open: open.filter((j) => j.cities.includes("india-anywhere")).length },
    ].filter((c) => c.open > 0),
    facets: {
      levels: ["internship", "program", "graduate", "experienced", "unknown"],
      disciplines: ["software", "data", "ml", "infra", "security", "quant", "research", "product", "other"],
      focuses: ["low-latency", "ml-ai", "data", "security", "backend", "frontend", "fullstack", "mobile", "platform", "systems", "hardware", "support", "quant", "qa"],
      work_modes: ["onsite", "hybrid", "remote", "unknown"],
      event_types: ["walk-in", "hiring-event", "campus-drive"],
      sectors: ["quant", "tech"],
      categories: ["hft", "quant-research", "ai-lab", "global-tech", "indian-product", "services"],
      tracks: ["engineering", "product"],
    },
    sources: report.map((r) => ({
      key: sourceKey(r.src), name: r.src.name, sector: r.src.sector, category: r.src.category,
      error: r.error || null, rows: r.rows ?? 0, india: r.india ?? 0,
    })).sort((a, b) => (b.india || 0) - (a.india || 0)),
  };

  // ---- report -------------------------------------------------------------
  console.log("source".padEnd(34), "rows".padStart(6), "india".padStart(6), "  status");
  console.log("-".repeat(66));
  for (const r of meta.sources) {
    console.log(
      `${r.key}`.padEnd(34),
      String(r.rows).padStart(6),
      String(r.india).padStart(6),
      "  " + (r.error ? `ERROR ${r.error}` : ""),
    );
  }
  console.log("-".repeat(66));
  console.log(`jobs in dataset: ${jobs.length}  (open ${open.length}, closed retained ${jobs.length - open.length})`);
  console.log(`walk-in / hiring-event roles: ${meta.counts.walk_ins}`);
  console.log(`companies with open roles: ${meta.counts.companies}`);
  console.log(`non-engineering roles filtered out: ${skipped.length}`);
  console.log(`cities represented: ${meta.cities.length}`);

  if (DRY) { console.log("\n--dry: nothing written"); return; }

  writeFileSync(join(DATA, "jobs.json"), JSON.stringify(jobs));
  writeFileSync(join(DATA, "companies.json"), JSON.stringify(companyList, null, 2));
  writeFileSync(join(DATA, "meta.json"), JSON.stringify(meta, null, 2));
  console.log(`\nwrote data/jobs.json (${(JSON.stringify(jobs).length / 1024).toFixed(0)} KB), data/companies.json, data/meta.json`);
}

main().catch((e) => { console.error(e); process.exit(1); });
