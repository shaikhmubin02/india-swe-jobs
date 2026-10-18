# India SWE Jobs

A job board for **software-engineering roles in India** across two segments:

- **HFT / quant** — IMC, Point72, Squarepoint, Tower Research, Jump Trading, Optiver, WorldQuant, AlphaGrep, Da Vinci
- **Tech** — AI labs (OpenAI, Anthropic, Cursor, ElevenLabs, Harvey), global tech / GCC employers (Databricks, MongoDB, Stripe, Zscaler, GitLab, Rubrik, Datadog, Elastic, Snowflake, PayPal-tier fintechs) and Indian product companies (Paytm, Meesho, CRED, Groww, InMobi, Zeta, Glance, HighRadius, Netradyne, Druva, Mindtickle, Atlan)

Plus **city filters** (Bengaluru, Mumbai, Delhi NCR, Gurugram, Hyderabad, Pune, Chennai, Ahmedabad, Kolkata, Chandigarh…) and a first-class **walk-in interview** section.

The architecture is a deliberate mirror of a reverse-engineered Next.js job aggregator: no runtime jobs API, the full dataset is embedded in the RSC payload of every listing page, and all filtering happens on the client.

---

## Quick start

```bash
npm install
npm run ingest      # fetch all sources -> data/*.json
npm run dev         # http://localhost:4321
```

Production:

```bash
npm run build
npm start
```

Set the canonical origin for sitemap/robots:

```bash
NEXT_PUBLIC_SITE_URL=https://your-domain.example npm run build
```

---

## Architecture

Recovered from the reference site and reproduced here:

| Reference behaviour | This project |
|---|---|
| No jobs API — every listing page server-renders the entire `jobs: [...]` array into the RSC flight payload (`self.__next_f.push`) | Same. `lib/data.ts` imports `data/jobs.json`; every page is statically prerendered (`○`/`●` in the build output) |
| All filtering, sorting and pagination client-side, no `searchParams` | Same. `components/Explorer.tsx` holds filter state and derives everything with `useMemo` |
| Controlled vocabularies for `level` / `discipline` / `focus` | Same names, extended with India-specific `cities`, `work_mode`, `walk_in`, `event_type`, `track` |
| `POST /api/click` (body: bare job id) and `POST /api/save` (body: `save:<id>` / `unsave:<id>`) via `sendBeacon`; non-POST → 403 | Same wire format, same status codes (`app/api/click`, `app/api/save`) |
| Closed roles retained for a while after they disappear | Retained 30 days, greyed out behind a "View closed roles" toggle |
| `localStorage` keys `saved-jobs` (cap 200), `theme`, `sidebar-w`, `sort`, `closed` | Same keys, same cap, schema-validated on read |
| Engagement ranks (`popular_rank`, `trending_rank`) baked in at build time | Same — counters accumulate continuously, `ingest` reads them and bakes the ranking |
| `robots.txt` disallows everything except Googlebot | **Inverted on purpose** — this board wants to be indexed |

### Layout

```
scripts/
  sources.mjs      source registry — one line per company
  classify.mjs     level / discipline / focus / work mode / walk-in classifiers
  cities.mjs       India city gazetteer + location-string parser
  ingest.mjs       fetch -> normalise -> filter to India -> classify -> write data/
  verify-data.mjs  integrity gate — refuses to publish a collapsed dataset
  screenshots.mjs  refresh docs/*.png against a running server (npm run shots)
  check-walkins.mjs sanity-check the walk-in detector against live board text
data/
  jobs.json        materialised dataset (embedded into the RSC payload)
  companies.json   company index
  meta.json        counts, facet vocabularies, per-source ingest report
  manual-jobs.json hand-curated entries (walk-in drives, firms without a board API)
  clicks.json      anonymous aggregate counters (gitignored)
lib/
  types.ts data.ts taxonomy.ts store.ts counter.ts site.ts
app/
  page.tsx internships/ new-grad/ experienced/ walkins/ companies/ city/[slug]/ saved/ about/ privacy/ contact/
  api/click/ route.ts   api/save/ route.ts
components/
  Explorer.tsx     the client board: facets, city filter, walk-in toggle, sorting, pagination
.github/
  workflows/refresh.yml  scheduled ingest -> verify -> build -> commit
docs/              screenshots of each view (npm run shots)
```

---

## Data sources

Every listing comes from a company's own public job-board API:

| ATS | Endpoint |
|---|---|
| Greenhouse | `boards-api.greenhouse.io/v1/boards/{token}/jobs?content=true` |
| Ashby | `api.ashbyhq.com/posting-api/job-board/{org}` |
| Lever | `api.lever.co/v0/postings/{token}?mode=json` |

Plus generic `json` and `rss` adapters for anything else, and a `manual` source for curated entries.

**What is not scraped.** No career-site scraping, no bot-protection bypass, and nothing from a portal whose `robots.txt` disallows automated access. That rules out **LinkedIn** twice over: its `robots.txt` opens by stating that automated access without express permission is "strictly prohibited", and it publishes no public jobs API in any case. If an employer exposes a machine-readable board we read it; otherwise they are not listed.

**What could not be included.** The large Indian IT-services firms (TCS, Infosys, Wipro, HCLTech, Cognizant, Accenture, Capgemini, LTIMindtree), the hyperscalers (Google, Amazon, Microsoft, Meta, Apple), and most banks and GCCs run in-house ATSs — Workday, Taleo, SuccessFactors, custom portals — that expose no public board API. This is not a case of information being hidden behind a trick; there is simply nothing to fetch. **3,084 candidate board tokens were probed for them, 148 resolve to a live board, and 61 of those carry India postings** — 60 are listed here, and the one exclusion is explained under *Coverage and known gaps*. The rest do not exist.

### Adding a company

```js
// scripts/sources.mjs
{ type: "greenhouse", token: "acme", name: "Acme", slug: "acme",
  sector: "tech", category: "indian-product", careers: "https://acme.example/careers" },
```

Then `npm run ingest && npm run build`.

---

## Coverage and known gaps

The board lists **60 company boards**. That is not a curated shortlist — it is the residue of probing **3,084 candidate tokens** against Greenhouse, Ashby and Lever and keeping every one that was genuinely the employer's board and carried India postings.

| Sweep | Scope | Tokens | Resolve | With India roles |
|---|---|---:|---:|---:|
| 1 | quant/HFT, AI labs, global tech, Indian product | 151 | 86 | 38 |
| 2 | same names, spelling and variant retries | 302 | 46 | 21 |
| 3 | long tail (AI labs, misc) | 227 | 3 | 0 |
| 4 | names a reader would notice as missing (see below) | 604 | 13 | 2 |
| 5 | region-split tokens — `<firm>india`, `<firm>-india`, `<firm>in`, `<firm>gcc`, `<firm>global` — for 100 firms | 1,800 | 0 | 0 |
| | **total** | **3,084** | **148** | **61** |

Sweeps 1 and 2 returned disjoint sets (38 + 21 = 59 boards), which seeded the registry. Sweep 4 added Thoughtworks. That accounts for 60 of the 61. The sixty-first is `lever:linkedin`, which resolves and shows 14 Bangalore reqs but whose postings are test fixtures — `Deauth Test`, `RF_TEST_BUG_BASH_Lever`, `sgupta13_test_job`, `Truck Driver - Hawai`, `Rug Maker` — a vendor evaluation sandbox, not LinkedIn's careers board. It is excluded.

Also resolved, but with no India roles, and therefore not listed: TCS's Greenhouse board is UK-only (Bath, Bristol, Leeds, Chippenham…); Jane Street's lists New York, London, Hong Kong and Singapore only; Hudson River Trading's is empty; Jump Trading's, Maven's and Quadrature's are US/London/remote-US.

### Not listed, and why

| Segment | Examples | Result |
|---|---|---|
| Indian IT services | TCS, Infosys, Wipro, HCLTech, Tech Mahindra, LTIMindtree, Mphasis, Persistent, Coforge, Zensar, Hexaware, Birlasoft, KPIT, Cyient, Tata Elxsi, Nagarro, GlobalLogic, Virtusa, Genpact | 93 tokens probed — 2 resolve (Thoughtworks, now listed; TCS, UK-only), rest are Workday/Taleo/custom portals |
| Indian product & consumer | Flipkart, Swiggy, Zomato, PhonePe, Razorpay, Zerodha, Dream11, Zepto, Navi, ShareChat, Udaan, Nykaa, PolicyBazaar, MakeMyTrip, Urban Company, Freshworks, Zoho, Postman, BrowserStack, Chargebee, Darwinbox, Whatfix, Innovaccer, Delhivery | 122 tokens probed, **0** resolve |
| Hyperscalers / big tech | Google, Amazon, Microsoft, Meta, Apple, Netflix | 36 tokens probed, none resolve |
| Banks, GCCs, hardware | Goldman Sachs, JPMorgan, Morgan Stanley, Barclays, HSBC, Citi, Mastercard, Visa, PayPal, Walmart, Target, Lowe's, Salesforce, ServiceNow, SAP, Oracle, Adobe, Nvidia, Qualcomm, Cisco, Dell, Intel, AMD, Micron, Arm, Siemens, Bosch | 162 tokens probed, none resolve |
| HFT with India desks | Graviton, Quadeye, iRage, Axxela, Trexquant, D. E. Shaw, Millennium, Citadel, DRW, SIG, QRT, Radix | 138 tokens probed, 7 resolve, none with India roles |

The pattern is not arbitrary: the firms large enough to run their own ATS are precisely the firms with no public board API, so the biggest India employers are the least machine-readable — and a region-split board, the other plausible workaround, essentially does not exist in the wild (0 for 1,800).

**The honest summary:** 60 boards is close to exhaustive for *public-API* employers, and that is a small slice of India's SWE hiring. Anyone who needs TCS, Flipkart and Google on one screen needs the curated feed (`data/manual-jobs.json`) populated, or a licensed data provider — a bigger sweep will not produce them.

---

## Classification

ATS feeds are inconsistent — "SDE 2", "Member of Technical Staff", "Software Engineer III" — so everything is normalised at ingest time.

- **Level** — `internship` · `program` (graduate/rotational programmes) · `graduate` (new grad, fresher, junior, entry-level) · `experienced` · `unknown`
- **Discipline** — `software` · `data` · `ml` · `infra` · `security` · `quant` · `research` · `product` · `other`
- **Focus** — `low-latency` (HFT) · `ml-ai` · `data` · `security` · `backend` · `frontend` · `fullstack` · `mobile` · `platform` · `systems` · `hardware` · `support` · `qa`
- **Work mode** — `onsite` · `hybrid` · `remote`
- **City** — canonical slug resolved from messy strings (`"Bengaluru, Karnataka, India; Hyderabad, Telangana, India"`, Ashby's `"IN-Bengaluru"`, `"Remote - India"`)
- **Track** — `engineering` · `product`. The board defaults to engineering-only.

**Track is decided title-first.** Matching on description text pulls in business roles that merely mention engineers ("AR Analyst", "Deal Desk Analyst", "Content Creator"). A role is engineering only if its title matches a known engineering pattern. Non-engineering roles are dropped at ingest — currently ~625 India postings per refresh.

---

## Walk-in interviews

This is the one section not fed by the ATS boards, and the reason is worth stating plainly.

**Finding:** all 60 configured boards were checked. Descriptions are populated for **99.2%** of India postings (~1,170 of ~1,180). Across every one of them there was **not a single mention** of a walk-in, campus drive, hiring event, mega drive, job fair or open house. Large trading firms, AI labs and product companies simply do not recruit that way.

In India, walk-in interviews are the recruitment channel of the **IT-services and staffing sector** — and those firms run closed, in-house portals. So walk-ins enter through an explicit operator-controlled feed rather than a scraper:

1. **Curated** — append to `data/manual-jobs.json`. Schema in `data/walkins.example.json`:
   ```json
   {
     "id": "acme-walkin-1",
     "title": "Walk-in interview: Java / Spring Boot Developer (2–6 yrs)",
     "company": "Acme IT Services",
     "company_slug": "acme-it-services",
     "url": "https://acme.example/careers/walkin-java",
     "location": "Bengaluru, Karnataka, India",
     "posted": "2026-10-18",
     "walk_in": true,
     "event_type": "walk-in"
   }
   ```
   `event_type` is `walk-in`, `hiring-event` or `campus-drive`.
2. **A feed you are licensed to use** — add a source with `type: "rss"` or `type: "json"` and a field mapping.

The classifier itself is wired and tested (`npm run check-walkins`). Any posting — from any source — whose title or description contains walk-in / campus-drive / hiring-event phrasing is tagged automatically, appears on `/walkins`, and can be filtered by event type in the sidebar. The section is complete; it is waiting on data that only the operator can supply.

---

## Engagement counters

`POST /api/click` and `POST /api/save` increment **aggregate** counters only — no IPs, no user agents, no cookies. `scripts/ingest.mjs` reads them and bakes `popular_rank` / `trending_rank` into the dataset at build time, so the ordering is served statically.

`lib/counter.ts` writes to `data/clicks.json`. For a serverless or edge deployment, swap it for a KV namespace (Cloudflare KV, Upstash, Durable Object) — the surface is two functions, `incrementClick` and `incrementSave`.

---

## Update cadence

Nothing updates on its own. The dataset is a build artifact — it only moves when `ingest` runs and the app is rebuilt, and the same is true of the reference site.

```bash
npm run refresh     # ingest && build
npm run verify      # integrity gate; fails loudly if a board's API shape changed
```

**On a schedule.** `.github/workflows/refresh.yml` runs the whole cycle every 6 hours (and on demand from the Actions tab): ingest → verify → build → commit the regenerated `data/` back to the branch. Any host that builds on push — Vercel, Netlify, Render, Cloudflare — picks that commit up by itself; a self-hosted deployment can uncomment the `vercel deploy` step in the workflow. The reference site rebuilds on about the same six-hour rhythm, so nothing is gained by going faster than that.

The `verify` step is the part worth keeping. It exists for the failure this design is prone to: a board changes its response shape, the adapter quietly returns an empty list, and the build publishes an empty board. `verify` fails the run instead of the site.

**Locally** (Windows), if you would rather not involve CI:

```powershell
schtasks /create /tn "india-swe-jobs refresh" /sc hourly /mo 6 `
  /tr "cmd /c cd /d C:\path\to\india-swe-jobs && npm run refresh"
```

**One caveat for CI.** `data/clicks.json` and `data/saves.json` hold the aggregate engagement counters and are gitignored, so a fresh clone bakes every `popular_rank` as null and the popular/trending orderings reset on each run. The workflow caches those two files between runs to prevent it; for a real deployment, point `lib/counter.ts` at KV and delete the cache step.

---

## Provenance

The architecture — data model, client-side faceting, the two beacon endpoints, closed-role retention, the `localStorage` keys — was recovered by passive reverse engineering of a public Next.js job aggregator using [REA](https://github.com/morluto/rea) (CDP-driven browser observation, bundle analysis, and decoding of the RSC flight payload). No request that mutated state was issued during that analysis. The full write-up is kept with the project notes rather than in this repository.

## Deploy

The two `/api/*` beacon routes mean this is a Next.js **server** app, not a static export, so it needs a host that runs Node. Vercel runs it with no configuration:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fshaikhmubin02%2Findia-swe-jobs)

`robots.txt` and `sitemap.xml` need an absolute origin. On Vercel that resolves itself from the project's own domain (`VERCEL_PROJECT_PRODUCTION_URL`), so a stock deploy is correct with no configuration. Set `NEXT_PUBLIC_SITE_URL` only when you put a custom domain in front of it:

```bash
NEXT_PUBLIC_SITE_URL=https://your-domain.example
```

**Worth knowing before the first deploy.** `lib/counter.ts` persists the click/save counters to `data/clicks.json` and `data/saves.json`, and a serverless filesystem is read-only. It already degrades quietly — the beacon routes still return `204`, the counts simply live in memory for the life of each instance, and `popular_rank` stays `null`. That is fine to launch with. To make the ranking real, swap the two functions in `lib/counter.ts` for KV (Upstash Redis, Cloudflare KV) behind the same `incrementClick` / `incrementSave` signatures, and drop the `data/clicks.json` cache step from `.github/workflows/refresh.yml`.

The dataset is committed, so the first deploy is complete on its own; `.github/workflows/refresh.yml` then re-ingests and commits every 6 hours.

## Licence

Code: MIT. Job listing data belongs to the respective employers and is reproduced only as titles, locations and application links.
