// Sanity-check the walk-in / hiring-event classifier against real board text.
// Fetches the configured boards and greps every description for the phrasing
// Indian employers use for walk-in drives.
import { SOURCES } from "./sources.mjs";
import { classifyEvent } from "./classify.mjs";
import { parseLocations } from "./cities.mjs";

function decode(s) {
  return String(s || "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");
}
function strip(h) {
  return decode(h).replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/gi, " ").replace(/\s+/g, " ").trim();
}

async function rows(src) {
  try {
    if (src.type === "greenhouse") {
      const r = await fetch(`https://boards-api.greenhouse.io/v1/boards/${src.token}/jobs?content=true`);
      if (!r.ok) return [];
      const j = await r.json();
      return (j.jobs || []).map((x) => ({ title: x.title, loc: x.location?.name || "", desc: strip(x.content) }));
    }
    if (src.type === "ashby") {
      const r = await fetch(`https://api.ashbyhq.com/posting-api/job-board/${src.token}`);
      if (!r.ok) return [];
      const j = await r.json();
      return (j.jobs || []).map((x) => ({ title: x.title, loc: [x.location, ...(x.secondaryLocations || []).map((s) => s.location)].filter(Boolean).join("; "), desc: strip(x.descriptionPlain || x.descriptionHtml) }));
    }
    if (src.type === "lever") {
      const r = await fetch(`https://api.lever.co/v0/postings/${src.token}?mode=json`);
      if (!r.ok) return [];
      const j = await r.json();
      return (j || []).map((x) => ({ title: x.text, loc: x.categories?.location || "", desc: strip(x.descriptionPlain || x.description) }));
    }
  } catch { /* ignore */ }
  return [];
}

const KEY = /\b(walk[\s-]?in|walkin|campus drive|off[\s-]?campus|hiring event|mega drive|job fair|open house|recruitment drive)\b/i;

let withDesc = 0, total = 0, india = 0, hits = [];
const perSource = [];

for (const src of SOURCES.filter((s) => s.type !== "manual")) {
  const list = await rows(src);
  const ind = list.filter((r) => parseLocations(r.loc).isIndia);
  const described = ind.filter((r) => r.desc && r.desc.length > 100);
  total += list.length; india += ind.length; withDesc += described.length;
  const found = ind.filter((r) => KEY.test(`${r.title} ${r.desc}`));
  perSource.push({ key: `${src.type}:${src.token}`, india: ind.length, described: described.length, walkin: found.length });
  for (const f of found) hits.push({ src: src.name, title: f.title, loc: f.loc, type: classifyEvent(f.title, f.desc) });
  await new Promise((r) => setTimeout(r, 60));
}

console.log(`total rows fetched : ${total}`);
console.log(`India rows         : ${india}`);
console.log(`India + description: ${withDesc}   (descriptions populated: ${((withDesc / Math.max(india, 1)) * 100).toFixed(1)}%)`);
console.log(`walk-in keyword hits: ${hits.length}\n`);
console.log("per-source India rows / described / walk-in hits");
for (const p of perSource.filter((p) => p.walkin || p.india).sort((a, b) => b.walkin - a.walkin).slice(0, 20)) {
  console.log(`  ${p.key.padEnd(32)} india=${String(p.india).padStart(4)}  desc=${String(p.described).padStart(4)}  walkin=${p.walkin}`);
}
console.log("\nhits:");
for (const h of hits) console.log(`  [${h.type}] ${h.src}: ${h.title}  @ ${h.loc}`);
