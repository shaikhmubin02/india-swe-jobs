import jobsJson from "@/data/jobs.json";
import companiesJson from "@/data/companies.json";
import metaJson from "@/data/meta.json";
import type { Job, Company, Meta } from "./types";

// The entire data set is imported at build time and embedded into the RSC
// payload of each listing page. There is no runtime jobs API - matching the
// architecture recovered from the reference site.
export const JOBS = jobsJson as unknown as Job[];
export const COMPANIES = companiesJson as unknown as Company[];
export const META = metaJson as unknown as Meta;

export const OPEN_JOBS = JOBS.filter((j) => j.is_open);

export function companyBySlug(slug: string): Company | undefined {
  return COMPANIES.find((c) => c.slug === slug);
}

export function jobsForCompany(slug: string): Job[] {
  return JOBS.filter((j) => j.company_slug === slug);
}

export function citiesInUse(): { slug: string; name: string; count: number }[] {
  return META.cities.map((c) => ({ slug: c.slug, name: c.name, count: c.open }));
}

export const GENERATED_AT = META.generated_at;

// Freshness: how long ago the data set was built.
export function dataAgeHours(): number {
  return Math.max(0, (Date.now() - Date.parse(META.generated_at)) / 3600_000);
}
