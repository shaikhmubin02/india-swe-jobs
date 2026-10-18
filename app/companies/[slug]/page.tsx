import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Explorer } from "@/components/Explorer";
import { COMPANIES, JOBS, META, companyBySlug } from "@/lib/data";
import { CATEGORY_LABEL, SECTOR_LABEL } from "@/lib/taxonomy";

export function generateStaticParams() {
  return COMPANIES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = companyBySlug(slug);
  if (!c) return { title: "Company not found" };
  return {
    title: `${c.name} engineering jobs in India`,
    description: `Open software engineering roles at ${c.name} in India — ${c.open} live positions across ${c.cities.length} cities.`,
  };
}

export default async function CompanyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const company = companyBySlug(slug);
  if (!company) notFound();

  const openHere = JOBS.filter((j) => j.company_slug === slug && j.is_open).length;
  const cityNames = company.cities
    .map((s) => META.cities.find((c) => c.slug === s)?.name || s)
    .filter(Boolean);

  return (
    <>
      <div className="shell" style={{ paddingTop: 22 }}>
        <div className="panel">
          <div className="panel-body" style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
            <div
              className="logo"
              style={{ width: 52, height: 52, fontSize: 19, color: `hsl(${hue(slug)} 45% 38%)`, background: `hsl(${hue(slug)} 45% 96%)` }}
              aria-hidden
            >
              {company.name.replace(/[^\w\s]/g, "").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase()}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <h1 className="page-title" style={{ margin: 0, fontSize: 22 }}>{company.name}</h1>
              <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 3 }}>
                {CATEGORY_LABEL[company.category]} · {SECTOR_LABEL[company.sector]} · {openHere} open{" "}
                {openHere === 1 ? "role" : "roles"} in India
                {company.walk_ins > 0 ? ` · ${company.walk_ins} walk-in` : ""}
              </div>
              {cityNames.length > 0 && (
                <div className="badge-row">
                  {cityNames.map((n) => <span className="tag city" key={n}>📍 {n}</span>)}
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {company.careers && (
                <a className="chip-btn" href={company.careers} target="_blank" rel="noopener noreferrer">
                  Careers site ↗
                </a>
              )}
              <Link className="chip-btn" href="/companies">All companies</Link>
            </div>
          </div>
        </div>
      </div>

      <Explorer
        jobs={JOBS}
        companies={COMPANIES}
        meta={META}
        heading={`${company.name} — open engineering roles`}
        subheading={`Every role this board currently tracks at ${company.name} in India. Source board: ${company.ats}:${company.token}.`}
        initial={{ companies: [slug], tracks: ["engineering", "product"] }}
        emptyTitle={`No open roles at ${company.name} right now`}
        emptyHint="Roles appear as soon as the company's board lists them."
      />
    </>
  );
}

function hue(slug: string): number {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) % 360;
  return h;
}
