import type { Metadata } from "next";
import { Explorer } from "@/components/Explorer";
import { COMPANIES, JOBS, META } from "@/lib/data";

export const metadata: Metadata = {
  title: "Experienced engineers",
  description:
    "Experienced software engineering jobs in India — senior, staff and lead roles at HFT/quant firms, AI labs, global tech and Indian product companies.",
};

export default function ExperiencedPage() {
  const count = JOBS.filter((j) => j.is_open && j.track === "engineering" && j.level === "experienced").length;
  return (
    <Explorer
      jobs={JOBS}
      companies={COMPANIES}
      meta={META}
      heading="Experienced software engineering jobs in India"
      subheading={`${count} roles for engineers with prior experience — including low-latency trading systems, distributed infrastructure, ML platform and security engineering.`}
      initial={{ levels: ["experienced"] }}
      emptyTitle="No experienced roles match these filters"
    />
  );
}
