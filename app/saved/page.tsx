import type { Metadata } from "next";
import { SavedList } from "@/components/SavedList";
import { JOBS, META } from "@/lib/data";

export const metadata: Metadata = {
  title: "Saved roles",
  description: "Roles you have saved. Stored locally in your browser.",
  robots: { index: false },
};

export default function SavedPage() {
  const cityNames = Object.fromEntries(META.cities.map((c) => [c.slug, c.name]));
  return (
    <div className="shell" style={{ paddingBottom: 60 }}>
      <h1 className="page-title" style={{ marginTop: 22 }}>Saved roles</h1>
      <p className="page-sub">
        Saved in this browser only — there is no account and nothing is uploaded. Up to 200 roles.
      </p>
      <SavedList jobs={JOBS} cityNames={cityNames} />
    </div>
  );
}
