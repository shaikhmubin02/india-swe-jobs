"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Job } from "@/lib/types";
import { DISCIPLINE_LABEL, EVENT_LABEL, LEVEL_LABEL, relativeTime } from "@/lib/taxonomy";
import { loadSaved, persistSaved } from "@/lib/store";

export function SavedList({ jobs, cityNames }: { jobs: Job[]; cityNames: Record<string, string> }) {
  const [saved, setSaved] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => { setSaved(loadSaved()); setReady(true); }, []);
  useEffect(() => { if (ready) persistSaved(saved); }, [saved, ready]);

  const byId = useMemo(() => new Map(jobs.map((j) => [j.id, j])), [jobs]);
  const items = saved.map((id) => byId.get(id)).filter((j): j is Job => Boolean(j));
  const missing = saved.length - items.length;

  if (!ready) {
    return <div className="panel"><div className="empty">Loading saved roles…</div></div>;
  }

  if (saved.length === 0) {
    return (
      <div className="panel">
        <div className="empty">
          <div className="empty-big">No saved roles yet</div>
          <div>Tap ☆ Save on any role and it will show up here — stored in this browser only, no account needed.</div>
          <div style={{ marginTop: 12 }}>
            <Link className="chip-btn" href="/">Browse all roles</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="toolbar" style={{ marginBottom: 10 }}>
        <span className="toolbar-title">{items.length} saved {items.length === 1 ? "role" : "roles"}</span>
        <div className="toolbar-right">
          <button className="chip-btn" onClick={() => setSaved([])}>Clear all</button>
        </div>
      </div>

      <div className="panel">
        <div className="job-list">
          {items.map((j) => (
            <article className={`job${j.is_open ? "" : " closed"}`} key={j.id}>
              <div className="job-main">
                <div className="job-title-row">
                  <a className="job-title" href={j.url} target="_blank" rel="noopener noreferrer nofollow">{j.title}</a>
                  <Link className="job-co" href={`/companies/${j.company_slug}`}>{j.company}</Link>
                </div>
                <div className="job-meta">
                  {j.walk_in && j.event_type && <span className="tag walkin">● {EVENT_LABEL[j.event_type]}</span>}
                  <span className="tag level">{LEVEL_LABEL[j.level]}</span>
                  <span className="tag">{DISCIPLINE_LABEL[j.discipline]}</span>
                  {j.cities.slice(0, 3).map((c) => <span className="tag city" key={c}>📍 {cityNames[c] || c}</span>)}
                  {!j.is_open && <span className="tag closed">Closed</span>}
                </div>
              </div>
              <div className="job-side">
                <span className="job-when">{relativeTime(j.source_posted || j.first_seen)}</span>
                <button className="save-btn on" onClick={() => setSaved((s) => s.filter((x) => x !== j.id))}>
                  ★ Remove
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>

      {missing > 0 && (
        <p style={{ color: "var(--muted)", fontSize: 12.5, marginTop: 12 }}>
          {missing} saved {missing === 1 ? "role is" : "roles are"} no longer on the board (closed more than{" "}
          the retention window ago) and could not be shown.
        </p>
      )}
    </>
  );
}
