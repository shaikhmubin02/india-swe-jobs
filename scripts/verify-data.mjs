// Data integrity gate. Runs after `ingest` and before a build/deploy.
//
// The failure mode this exists for: a board changes its API shape, the adapter
// silently returns nothing, and a refresh happily overwrites a good dataset
// with an empty one. Anything below trips that instead of publishing it.
import { readFileSync } from "node:fs";

const MIN_JOBS = 100; // a collapse well below the real dataset size

const problems = [];
const note = (m) => problems.push(m);

let meta, jobs;
try {
  meta = JSON.parse(readFileSync("data/meta.json", "utf8"));
  jobs = JSON.parse(readFileSync("data/jobs.json", "utf8"));
} catch (e) {
  console.error(`cannot read data/: ${e.message}`);
  process.exit(1);
}

if (!Array.isArray(jobs)) note("data/jobs.json is not an array");
if (jobs.length < MIN_JOBS) note(`only ${jobs.length} jobs (floor is ${MIN_JOBS}) — an adapter probably broke`);
if (!meta?.counts || typeof meta.counts.sources !== "number") note("data/meta.json has no counts.sources");
if (meta && meta.counts && meta.counts.sources < 1) note("meta.counts.sources is 0");

// every row must be renderable and linkable
const seen = new Set();
let engineering = 0;
for (const [i, j] of (jobs || []).entries()) {
  for (const f of ["id", "title", "url", "company", "company_slug", "track", "source_board"]) {
    if (!j[f]) note(`jobs[${i}] missing ${f}`);
  }
  if (seen.has(j.id)) note(`duplicate job id ${j.id}`);
  seen.add(j.id);
  if (j.track === "engineering") engineering++;
  if (j.url && !/^https?:\/\//.test(j.url)) note(`jobs[${i}] url is not absolute: ${j.url}`);
  if (j.walk_in && !j.event_type) note(`jobs[${i}] is a walk-in with no event_type`);
}
if (engineering === 0) note("no engineering roles in the dataset — the classifier changed shape");

// a board that reports postings but no India rows is fine; a board that reports
// an error is worth surfacing, not failing on
const errored = (meta?.sources || []).filter((s) => s?.error);
if (errored.length) {
  console.warn(`warning: ${errored.length} source(s) errored during ingest`);
  for (const s of errored.slice(0, 10)) console.warn(`  ${s.key}: ${s.error}`);
}

if (problems.length) {
  console.error(`\ndata check FAILED (${problems.length}):`);
  for (const p of problems.slice(0, 40)) console.error(`  - ${p}`);
  process.exit(1);
}

const cities = new Set((jobs || []).flatMap((j) => j.cities || []));
console.log(
  `data ok: ${jobs.length} roles (${engineering} engineering) from ${meta.counts.sources} sources, ` +
  `${cities.size} cities, ${(meta.sources || []).length} boards reported`
);
