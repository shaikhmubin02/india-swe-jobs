import type { Metadata } from "next";
import Link from "next/link";
import { COMPANIES, JOBS, META } from "@/lib/data";
import { CATEGORY_LABEL, relativeTime } from "@/lib/taxonomy";

export const metadata: Metadata = {
  title: "About & methodology",
  description:
    "How this India software-engineering job board is built: sources, classification, refresh cadence, and what it deliberately does not do.",
};

export default function AboutPage() {
  const bySector = {
    quant: JOBS.filter((j) => j.is_open && j.track === "engineering" && j.sector === "quant").length,
    tech: JOBS.filter((j) => j.is_open && j.track === "engineering" && j.sector === "tech").length,
  };

  return (
    <div className="shell" style={{ paddingBottom: 60 }}>
      <div className="prose" style={{ paddingTop: 22 }}>
        <h1 className="page-title">About this board</h1>
        <p className="page-sub">
          A focused index of software-engineering roles in India, with the HFT/quant and tech
          segments kept separate so you can target either.
        </p>

        <div className="stat-grid">
          <div className="stat"><div className="stat-n">{META.counts.open_engineering.toLocaleString()}</div><div className="stat-l">Open engineering roles</div></div>
          <div className="stat"><div className="stat-n">{bySector.quant}</div><div className="stat-l">Quant / HFT</div></div>
          <div className="stat"><div className="stat-n">{bySector.tech}</div><div className="stat-l">Tech</div></div>
          <div className="stat"><div className="stat-n">{META.cities.length}</div><div className="stat-l">Cities</div></div>
          <div className="stat"><div className="stat-n">{META.counts.sources}</div><div className="stat-l">Company boards</div></div>
        </div>

        <h2>Where the data comes from</h2>
        <p>
          Every listing is pulled from a company&rsquo;s own applicant-tracking system — Greenhouse,
          Ashby or Lever, all of which publish a public job-board API intended to be read. We do not
          scrape career sites, we do not bypass bot protection, and we do not touch portals whose
          <code>robots.txt</code> disallows automated access. If an employer exposes a machine-readable
          board, we read it; if they don&rsquo;t, they aren&rsquo;t listed.
        </p>
        <p>
          The board currently tracks {COMPANIES.length} company boards: {COMPANIES.filter((c) => c.category === "hft").length}{" "}
          HFT / prop-trading firms, {COMPANIES.filter((c) => c.category === "quant-research").length} quant-research
          firms, {COMPANIES.filter((c) => c.category === "ai-lab").length} AI labs,{" "}
          {COMPANIES.filter((c) => c.category === "global-tech").length} global tech / GCC employers,{" "}
          {COMPANIES.filter((c) => c.category === "indian-product").length} Indian product companies and{" "}
          {COMPANIES.filter((c) => c.category === "services").length} in software services.
        </p>

        <h2>Coverage, and what is missing</h2>
        <p>
          That count is not a shortlist. It is the residue of probing <strong>3,084 candidate board
          tokens</strong> against Greenhouse, Ashby and Lever. 148 resolve to a live board, 61 carry
          India postings, and all but one of those are listed here. The exception resolves for the token{" "}
          <code>linkedin</code> and shows 14 Bangalore reqs — but its postings are test fixtures
          (&ldquo;Deauth Test&rdquo;, &ldquo;RF_TEST_BUG_BASH_Lever&rdquo;, &ldquo;Truck Driver -
          Hawai&rdquo;, &ldquo;Rug Maker&rdquo;), which makes it a vendor evaluation sandbox rather than
          LinkedIn&rsquo;s careers board.
        </p>
        <p>
          The firms a reader is most likely to notice missing run their own applicant-tracking systems —
          Workday, Taleo, SuccessFactors, custom portals — that publish no board API at all. That covers
          the large Indian IT-services firms (TCS, Infosys, Wipro, HCLTech, LTIMindtree), the
          hyperscalers (Google, Amazon, Microsoft, Meta, Apple) and most banks and GCCs. Probing 122
          tokens for Indian product companies (Flipkart, Swiggy, Zomato, PhonePe, Razorpay, Zerodha,
          Freshworks, Zoho) resolved <strong>zero</strong>. So did 162 for banks and GCCs, and 36 for the
          hyperscalers. Region-split boards — <code>firmindia</code>, <code>firm-in</code>,{" "}
          <code>firmin</code>, the obvious workaround — were probed 1,800 times across 100 firms and
          resolved zero.
        </p>
        <p>
          The pattern is structural, not accidental: the largest India employers are the least
          machine-readable. Where one does become readable, adding it is one line — Thoughtworks was
          added exactly that way. But sweeping harder will never produce TCS or Flipkart on this board;
          that needs the curated feed, or a licensed data provider.
        </p>

        <h2>How roles are classified</h2>
        <p>
          ATS feeds are inconsistent — one company posts &ldquo;SDE 2&rdquo;, another
          &ldquo;Member of Technical Staff&rdquo;, a third &ldquo;Software Engineer III&rdquo;.
          Everything is normalised into the same small vocabularies at ingest time so the filters mean
          the same thing across every employer:
        </p>
        <ul>
          <li><strong>Level</strong> — internship, graduate programme, new grad / fresher, experienced.</li>
          <li><strong>Discipline</strong> — software, data, ML, infrastructure, security, quant, research, product.</li>
          <li><strong>Focus</strong> — the narrow specialisation, e.g. low-latency/HFT, ML-AI, backend, platform, systems, QA.</li>
          <li><strong>Work mode</strong> — on-site, hybrid, remote.</li>
          <li><strong>City</strong> — canonical city, resolved from messy strings like
            &ldquo;Bengaluru, Karnataka, India; Hyderabad, Telangana, India&rdquo; or Ashby&rsquo;s
            &ldquo;IN-Bengaluru&rdquo;.</li>
          <li><strong>Hiring event</strong> — walk-in interview, hiring event, or campus/off-campus drive.</li>
        </ul>
        <p>
          Non-engineering roles (sales, marketing, recruiting, finance, legal and so on) are filtered
          out at ingest. Across the current refresh that removed a large amount of noise from the raw
          feeds.
        </p>

        <h2>Walk-in interviews</h2>
        <p>
          Walk-ins get their own section because in India they are a distinct recruitment channel.
          It is worth being straight about the constraint: after checking all {META.counts.sources}{" "}
          boards, <strong>no ATS-published walk-in drives exist</strong> — those campaigns come from
          IT-services and staffing firms that run closed, in-house portals. So the walk-in section is
          fed by an operator-curated feed plus any RSS/JSON feed you supply, and the classifier
          automatically tags any posting from any source that mentions a walk-in, campus drive or
          hiring event. See the <Link href="/walkins">walk-in page</Link> for the details.
        </p>

        <h2>Freshness and closed roles</h2>
        <p>
          Data was last refreshed {relativeTime(META.generated_at)}. When a role disappears from an
          employer&rsquo;s board it is not deleted immediately — it is marked closed and kept visible
          (greyed out, behind the &ldquo;View closed roles&rdquo; toggle) for{" "}
          {META.closed_retention_days} days, then dropped. That mirrors how closed roles are handled on
          comparable boards and avoids a listing vanishing mid-application.
        </p>

        <h2>What this board deliberately does not do</h2>
        <ul>
          <li>
            No scraping of sites that disallow it, and no bot-protection bypass. LinkedIn is the clearest
            case: its <code>robots.txt</code> opens by stating that automated access without express
            permission is &ldquo;strictly prohibited&rdquo;, and it publishes no public jobs API in any
            case. So there are no LinkedIn listings — by design, not by oversight.
          </li>
          <li>No accounts, no résumés, no applications through this site — every link goes to the employer.</li>
          <li>No third-party ad or analytics scripts. Engagement is counted anonymously in aggregate (see <Link href="/privacy">Privacy</Link>).</li>
        </ul>

        <h2>Adding a company</h2>
        <p>
          Adding a firm is one line in <code>scripts/sources.mjs</code>, then{" "}
          <code>npm run ingest</code>. Native adapters exist for Greenhouse, Ashby and Lever; generic{" "}
          <code>json</code> and <code>rss</code> adapters cover everything else, and{" "}
          <code>data/manual-jobs.json</code> takes hand-curated entries such as walk-in drives.
        </p>

        <h2>Companies on the board</h2>
        <p style={{ color: "var(--muted)" }}>
          {(["hft", "quant-research", "ai-lab", "global-tech", "indian-product", "services"] as const).map((cat) => {
            const list = COMPANIES.filter((c) => c.category === cat);
            if (list.length === 0) return null;
            return (
              <span key={cat} style={{ display: "block", marginBottom: 6 }}>
                <strong style={{ color: "var(--text)" }}>{CATEGORY_LABEL[cat]}:</strong>{" "}
                {list.map((c, i) => (
                  <span key={c.slug}>
                    {i > 0 ? ", " : ""}
                    <Link href={`/companies/${c.slug}`}>{c.name}</Link>
                  </span>
                ))}
              </span>
            );
          })}
        </p>
      </div>
    </div>
  );
}
