import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description: "Corrections, company additions, and walk-in feed submissions.",
};

export default function ContactPage() {
  return (
    <div className="shell" style={{ paddingBottom: 60 }}>
      <div className="prose" style={{ paddingTop: 22 }}>
        <h1 className="page-title">Contact</h1>
        <p className="page-sub">
          This is a self-hosted board, so there is no support inbox wired up by default. Replace the
          address below with your own before deploying.
        </p>

        <h2>Company additions</h2>
        <p>
          The fastest route is a pull request that adds one line to{" "}
          <code>scripts/sources.mjs</code>. If the company is on Greenhouse, Ashby or Lever, include
          the board token — you can find it in the URL of their job board. Otherwise use the{" "}
          <code>json</code> or <code>rss</code> adapter.
        </p>

        <h2>Walk-in drives</h2>
        <p>
          Walk-in and hiring-event listings come from a curated feed. To submit one, add an entry to{" "}
          <code>data/manual-jobs.json</code> with <code>walk_in: true</code> and an{" "}
          <code>event_type</code> of <code>walk-in</code>, <code>hiring-event</code> or{" "}
          <code>campus-drive</code>. The schema is documented in{" "}
          <code>data/walkins.example.json</code>.
        </p>

        <h2>Corrections</h2>
        <p>
          If a role is mis-classified — wrong city, wrong level, a non-engineering role that slipped
          through — the fix belongs in <code>scripts/classify.mjs</code> or{" "}
          <code>scripts/cities.mjs</code> so it applies to every future posting from that employer, not
          just the one listing.
        </p>

        <h2>Getting removed</h2>
        <p>
          If you are an employer and would rather not be indexed, say so and the source is removed at
          the next refresh. Every listing links directly to your own application page, and we never
          gate or proxy applications.
        </p>
      </div>
    </div>
  );
}
