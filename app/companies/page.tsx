import type { Metadata } from "next";
import Link from "next/link";
import { COMPANIES, META } from "@/lib/data";
import { CATEGORY_LABEL } from "@/lib/taxonomy";

export const metadata: Metadata = {
  title: "Companies hiring engineers in India",
  description:
    "HFT and prop-trading firms, AI labs, global tech companies and Indian product companies hiring software engineers in India, with live open-role counts.",
};

export default function CompaniesPage() {
  const byCategory = new Map<string, typeof COMPANIES>();
  for (const c of COMPANIES) {
    if (!byCategory.has(c.category)) byCategory.set(c.category, []);
    byCategory.get(c.category)!.push(c);
  }
  const order = ["hft", "quant-research", "ai-lab", "global-tech", "indian-product"];

  return (
    <div className="shell" style={{ paddingBottom: 60 }}>
      <h1 className="page-title" style={{ marginTop: 22 }}>Companies hiring engineers in India</h1>
      <p className="page-sub">
        {COMPANIES.filter((c) => c.open > 0).length} companies with live roles, from {META.counts.sources}{" "}
        configured boards. Counts show open engineering roles in India.
      </p>

      {order.map((cat) => {
        const list = byCategory.get(cat);
        if (!list) return null;
        const sorted = [...list]
          .filter((c) => c.open > 0)
          .sort((a, b) => b.open - a.open || a.name.localeCompare(b.name));
        if (sorted.length === 0) return null;
        return (
          <section key={cat} style={{ marginBottom: 30 }}>
            <h2 style={{ fontSize: 16, margin: "18px 0 10px" }}>
              {CATEGORY_LABEL[cat as never] || cat}
              <span style={{ color: "var(--muted)", fontWeight: 500, fontSize: 13, marginLeft: 8 }}>
                {sorted.reduce((n, c) => n + c.open, 0)} open
              </span>
            </h2>
            <div className="co-grid">
              {sorted.map((c) => (
                <Link key={c.slug} href={`/companies/${c.slug}`} className="panel co-card">
                  <div
                    className="logo"
                    style={{
                      color: `hsl(${hashHue(c.slug)} 45% 38%)`,
                      background: `hsl(${hashHue(c.slug)} 45% 96%)`,
                    }}
                    aria-hidden
                  >
                    {c.name.replace(/[^\w\s]/g, "").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div className="co-name">{c.name}</div>
                    <div className="co-meta">
                      {c.open} open · {c.cities.length} {c.cities.length === 1 ? "location" : "locations"}
                      {c.walk_ins > 0 ? ` · ${c.walk_ins} walk-in` : ""}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        );
      })}

      <div className="panel" style={{ marginTop: 10 }}>
        <div className="panel-head">Not listed yet</div>
        <div className="panel-body prose" style={{ maxWidth: "none" }}>
          <p>
            Large Indian IT-services firms (TCS, Infosys, Wipro, HCLTech, Cognizant, Accenture,
            Capgemini, LTIMindtree) and the hyperscalers (Google, Amazon, Microsoft) run in-house
            applicant-tracking systems with no public board API, so they cannot be ingested the same
            way. To add one, either point a <code>json</code>/<code>rss</code> source at a feed you
            are permitted to use, or add curated entries to <code>data/manual-jobs.json</code>.
          </p>
        </div>
      </div>
    </div>
  );
}

function hashHue(slug: string): number {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) % 360;
  return h;
}
