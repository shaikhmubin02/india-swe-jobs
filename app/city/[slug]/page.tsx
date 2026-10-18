import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Explorer } from "@/components/Explorer";
import { COMPANIES, JOBS, META } from "@/lib/data";

export function generateStaticParams() {
  // Pseudo-city "india-anywhere" is a facet convenience only, not a page.
  return META.cities.filter((c) => c.slug !== "india-anywhere").map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const city = META.cities.find((c) => c.slug === slug);
  if (!city) return { title: "City not found" };
  return {
    title: `Software engineering jobs in ${city.name}`,
    description: `${city.open} open software engineering roles in ${city.name} — HFT/quant firms, AI labs, global tech GCCs and Indian product companies.`,
  };
}

export default async function CityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const city = META.cities.find((c) => c.slug === slug);
  if (!city) notFound();

  const here = JOBS.filter((j) => j.is_open && j.track === "engineering" && j.cities.includes(slug));
  const companies = new Set(here.map((j) => j.company_slug));

  return (
    <Explorer
      jobs={JOBS}
      companies={COMPANIES}
      meta={META}
      heading={`Software engineering jobs in ${city.name}`}
      subheading={`${here.length} open roles from ${companies.size} companies in ${city.name}. Includes on-site and hybrid roles; remote-India roles are listed separately under "Remote (India)".`}
      initial={{ cities: [slug] }}
      emptyTitle={`No open roles in ${city.name} right now`}
      emptyHint="Try a nearby city or switch on remote roles."
    />
  );
}
