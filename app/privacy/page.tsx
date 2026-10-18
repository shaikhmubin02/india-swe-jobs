import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What this site stores, what it counts, and what it never collects.",
};

export default function PrivacyPage() {
  return (
    <div className="shell" style={{ paddingBottom: 60 }}>
      <div className="prose" style={{ paddingTop: 22 }}>
        <h1 className="page-title">Privacy</h1>
        <p className="page-sub">Short version: no accounts, no tracking scripts, no data sold.</p>

        <h2>Stored in your browser only</h2>
        <ul>
          <li><code>saved-jobs</code> — the ids of roles you save. Never uploaded.</li>
          <li><code>theme</code> — light or dark.</li>
          <li><code>sidebar-w</code> — your sidebar width.</li>
          <li><code>sort</code>, <code>closed</code>, <code>walkin</code>, <code>page-size</code> — your filter preferences.</li>
        </ul>
        <p>
          All of it lives in <code>localStorage</code> on your device. Clearing site data removes it.
          There is no account, so there is nothing to delete server-side.
        </p>

        <h2>Anonymous aggregate counts</h2>
        <p>
          Two endpoints receive anonymous signals, the same design used on comparable boards:
          <code>POST /api/click</code> when you open a role, and <code>POST /api/save</code> when you
          save one. These increment aggregate counters used to order the &ldquo;most viewed&rdquo; and
          &ldquo;trending&rdquo; sorts. They do not set cookies, do not store IP addresses or user
          agents, and cannot be tied back to you. The only thing sent is a job id.
        </p>

        <h2>No third parties</h2>
        <p>
          No advertising networks, no analytics SDKs, no social embeds, no fonts loaded from third-party
          servers. The only outbound requests are the ones you make by clicking through to an
          employer&rsquo;s job page.
        </p>

        <h2>Job listing data</h2>
        <p>
          Listings are read from employers&rsquo; public job-board APIs and cached as static pages.
          Titles, locations and application links are reproduced so you can find and apply for the
          role; the application itself always happens on the employer&rsquo;s own site.
        </p>
      </div>
    </div>
  );
}
