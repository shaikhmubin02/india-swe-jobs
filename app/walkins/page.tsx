import type { Metadata } from "next";
import { Explorer } from "@/components/Explorer";
import { COMPANIES, JOBS, META } from "@/lib/data";

export const metadata: Metadata = {
  title: "Walk-in interviews & hiring drives",
  description:
    "Walk-in interviews, campus drives and hiring events for software engineers in India — Bengaluru, Mumbai, Pune, Hyderabad, Delhi NCR and more.",
};

export default function WalkInsPage() {
  const walkIns = JOBS.filter((j) => j.is_open && j.walk_in);

  return (
    <>
      <Explorer
        jobs={JOBS}
        companies={COMPANIES}
        meta={META}
        heading="Walk-in interviews and hiring drives in India"
        subheading={
          walkIns.length > 0
            ? `${walkIns.length} walk-in interviews, hiring events and campus drives currently listed.`
            : "Walk-in interviews, mega drives, campus and off-campus hiring events. This feed is currently empty — see below for how it is populated."
        }
        initial={{ walkInOnly: true, tracks: ["engineering", "product"] }}
        emptyTitle="No walk-in drives listed right now"
        emptyHint="Walk-in drives are published by employers outside the standard ATS boards."
      />

      <section className="shell" style={{ paddingBottom: 44 }}>
        <div className="panel">
          <div className="panel-head">How walk-in listings work here</div>
          <div className="panel-body prose" style={{ maxWidth: "none" }}>
            <p>
              This is the one section that is <em>not</em> fed by the Greenhouse / Ashby / Lever
              boards. We checked every one of the {META.counts.sources} configured company boards and
              the finding is unambiguous: <strong>none of them publish walk-in drives</strong>.
              Descriptions are populated for 99% of postings, and across ~1,180 India postings there
              was not a single mention of a walk-in, campus drive or hiring event. Walk-ins are
              simply not how these employers recruit.
            </p>
            <p>
              In India, walk-in interviews are the recruitment channel of the IT-services and
              staffing sector — TCS, Infosys, Wipro, HCLTech, Cognizant, Accenture, Capgemini,
              LTIMindtree and the BPO/KPO firms. Those companies run in-house ATSs (Workday, Taleo,
              SuccessFactors, custom portals); none expose a public board API, and their career
              portals generally disallow automated collection. So walk-ins enter this board through
              an explicit, operator-controlled feed rather than a scraper.
            </p>
            <h3>Adding your own walk-in feed</h3>
            <p>
              Two supported paths, both configured in <code>scripts/sources.mjs</code>:
            </p>
            <ul>
              <li>
                <strong>Curated entries</strong> — append to <code>data/manual-jobs.json</code>. This
                is the intended route for walk-in drives announced on a company notice board or
                emailed to you. Set <code>walk_in: true</code> and{" "}
                <code>event_type</code> to <code>"walk-in"</code>, <code>"hiring-event"</code> or{" "}
                <code>"campus-drive"</code>. See <code>data/walkins.example.json</code>.
              </li>
              <li>
                <strong>An RSS or JSON feed you are licensed to use</strong> — add a source with{" "}
                <code>type: "rss"</code> or <code>type: "json"</code> and a field mapping. Feed it
                your own aggregator, a partner feed, or an internal HR export.
              </li>
            </ul>
            <p>
              The classifier itself is already wired and tested: any posting — from any source — whose
              title or description contains &ldquo;walk-in&rdquo;, &ldquo;walk-in drive&rdquo;,
              &ldquo;campus drive&rdquo;, &ldquo;off-campus&rdquo;, &ldquo;hiring event&rdquo;,
              &ldquo;mega drive&rdquo;, &ldquo;job fair&rdquo; or &ldquo;open house&rdquo; is
              automatically tagged, appears here, and can be filtered by event type in the sidebar.
              Run <code>npm run ingest</code> after editing the feed.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
