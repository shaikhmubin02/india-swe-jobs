import { Explorer } from "@/components/Explorer";
import { COMPANIES, JOBS, META } from "@/lib/data";

export default function HomePage() {
  return (
    <>
      <Explorer
        jobs={JOBS}
        companies={COMPANIES}
        meta={META}
        heading="Software engineering jobs in India"
        subheading="Every open engineering role we can find across HFT and prop-trading firms, AI labs, global tech companies with India offices, and Indian product companies. Filter by city, level, discipline and work mode — or switch on walk-in interviews."
        emptyTitle="No roles match these filters"
      />
      <section className="shell" style={{ paddingBottom: 40 }}>
        <div className="panel">
          <div className="panel-head">About this board</div>
          <div className="panel-body prose" style={{ maxWidth: "none" }}>
            <p>
              Listings are pulled directly from <strong>{META.counts.sources} company job
              boards</strong> (Greenhouse, Ashby and Lever) and refreshed on a schedule. Each role is
              classified into a level, discipline, focus, work mode and city so the filters stay
              consistent across very different employers — from Mumbai trading desks to Bengaluru
              GCCs.
            </p>
            <div className="stat-grid">
              <div className="stat"><div className="stat-n">{META.counts.open_engineering.toLocaleString()}</div><div className="stat-l">Open engineering roles</div></div>
              <div className="stat"><div className="stat-n">{META.counts.companies}</div><div className="stat-l">Companies hiring</div></div>
              <div className="stat"><div className="stat-n">{META.cities.length}</div><div className="stat-l">Cities covered</div></div>
              <div className="stat"><div className="stat-n">{META.counts.walk_ins}</div><div className="stat-l">Walk-in / hiring events</div></div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
