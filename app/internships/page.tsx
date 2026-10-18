import type { Metadata } from "next";
import { Explorer } from "@/components/Explorer";
import { COMPANIES, JOBS, META } from "@/lib/data";

export const metadata: Metadata = {
  title: "Internships",
  description:
    "Software engineering internships in India across HFT/quant firms, AI labs and tech companies — Bengaluru, Mumbai, Hyderabad, Pune and more.",
};

export default function InternshipsPage() {
  const count = JOBS.filter((j) => j.is_open && j.track === "engineering" && j.level === "internship").length;
  return (
    <Explorer
      jobs={JOBS}
      companies={COMPANIES}
      meta={META}
      heading="Software engineering internships in India"
      subheading={`${count} open internships. Includes summer analyst programmes at trading firms, research internships at AI labs, and engineering internships at product companies.`}
      initial={{ levels: ["internship"] }}
      emptyTitle="No internships match these filters"
    />
  );
}
