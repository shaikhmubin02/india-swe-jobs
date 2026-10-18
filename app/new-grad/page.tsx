import type { Metadata } from "next";
import { Explorer } from "@/components/Explorer";
import { COMPANIES, JOBS, META } from "@/lib/data";

export const metadata: Metadata = {
  title: "New grad & fresher roles",
  description:
    "New graduate and fresher software engineering jobs in India — entry-level roles at HFT/quant firms, AI labs, GCCs and Indian product companies.",
};

export default function NewGradPage() {
  const count = JOBS.filter(
    (j) => j.is_open && j.track === "engineering" && (j.level === "graduate" || j.level === "program"),
  ).length;
  return (
    <Explorer
      jobs={JOBS}
      companies={COMPANIES}
      meta={META}
      heading="New grad and fresher software engineering jobs in India"
      subheading={`${count} entry-level roles, graduate programmes and campus hires. Freshers and 0–2 year engineers — this is your cut of the board.`}
      initial={{ levels: ["graduate", "program"] }}
      emptyTitle="No new-grad roles match these filters"
    />
  );
}
