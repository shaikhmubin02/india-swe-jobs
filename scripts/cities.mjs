// India city gazetteer + location-string parser.
//
// ATS location strings are messy: "Bengaluru, India", "Gurugram",
// "Remote - India", "Bengaluru, Karnataka, India; Hyderabad, Telangana, India",
// "Mumbai / Bangalore". Everything is normalised down to canonical city slugs
// so the city facet stays clean.

// Country detection. Ashby emits ISO-style locations ("IN-Bengaluru", "GB-London"),
// so the bare "in-xx" prefix form is matched explicitly rather than a loose
// "in..." pattern that would also fire on "Indonesia".
export const COUNTRY_RE = /\b(india|bharat)\b|\bin-[a-z]{2}\b/i;

// Aliases include the tech-park names Indian employers actually use, because
// ATS feeds frequently post "Whitefield" or "HITEC City" instead of the city.
export const CITIES = [
  { slug: "bengaluru", name: "Bengaluru", region: "South", aliases: ["bangalore", "bengaluru", "blore", "blr", "whitefield", "electronic city", "koramangala", "hsr layout", "marathahalli", "hebbal", "yelahanka", "devanahalli", "bommasandra", "peenya", "jigani", "karnataka"] },
  { slug: "mumbai", name: "Mumbai", region: "West", aliases: ["mumbai", "bombay", "navi mumbai", "thane", "powai", "andheri", "bandra", "lower parel", "bkc", "airoli", "vashi", "ghansoli", "maharashtra"] },
  { slug: "pune", name: "Pune", region: "West", aliases: ["pune", "hinjewadi", "pimpri", "chinchwad", "baner", "kharadi", "magarpatta", "wakad", "viman nagar"] },
  { slug: "hyderabad", name: "Hyderabad", region: "South", aliases: ["hyderabad", "secunderabad", "hitec city", "hitech city", "gachibowli", "madhapur", "kondapur", "cyberabad", "telangana"] },
  { slug: "chennai", name: "Chennai", region: "South", aliases: ["chennai", "madras", "sholinganallur", "omr", "guindy", "taramani", "perungudi", "ambattur", "tamil nadu"] },
  { slug: "gurugram", name: "Gurugram", region: "North", aliases: ["gurugram", "gurgaon", "gurgoan", "manesar", "udyog vihar", "dlf cyber city", "sector 62 gurgaon"] },
  { slug: "noida", name: "Noida", region: "North", aliases: ["noida", "greater noida", "noida expressway", "sector 62 noida"] },
  { slug: "delhi", name: "Delhi", region: "North", aliases: ["delhi", "new delhi", "delhi ncr", "ncr", "okhla", "nehru place", "saket", "dwarka", "rohini"] },
  { slug: "ghaziabad", name: "Ghaziabad", region: "North", aliases: ["ghaziabad", "indirapuram"] },
  { slug: "faridabad", name: "Faridabad", region: "North", aliases: ["faridabad"] },
  { slug: "kolkata", name: "Kolkata", region: "East", aliases: ["kolkata", "calcutta", "salt lake", "newtown kolkata", "rajarhat", "sector v"] },
  { slug: "ahmedabad", name: "Ahmedabad", region: "West", aliases: ["ahmedabad", "gandhinagar", "gift city", "gujarat"] },
  { slug: "jaipur", name: "Jaipur", region: "North", aliases: ["jaipur", "rajasthan"] },
  { slug: "kochi", name: "Kochi", region: "South", aliases: ["kochi", "cochin", "ernakulam", "infopark", "kakkanad", "kerala"] },
  { slug: "thiruvananthapuram", name: "Thiruvananthapuram", region: "South", aliases: ["thiruvananthapuram", "trivandrum", "technopark"] },
  { slug: "coimbatore", name: "Coimbatore", region: "South", aliases: ["coimbatore", "kovai"] },
  { slug: "mysuru", name: "Mysuru", region: "South", aliases: ["mysore", "mysuru"] },
  { slug: "mangaluru", name: "Mangaluru", region: "South", aliases: ["mangalore", "mangaluru"] },
  { slug: "indore", name: "Indore", region: "West", aliases: ["indore"] },
  { slug: "bhopal", name: "Bhopal", region: "West", aliases: ["bhopal"] },
  { slug: "chandigarh", name: "Chandigarh", region: "North", aliases: ["chandigarh", "mohali", "panchkula"] },
  { slug: "nagpur", name: "Nagpur", region: "West", aliases: ["nagpur"] },
  { slug: "bhubaneswar", name: "Bhubaneswar", region: "East", aliases: ["bhubaneswar", "bhubaneshwar", "odisha", "orissa"] },
  { slug: "visakhapatnam", name: "Visakhapatnam", region: "South", aliases: ["visakhapatnam", "vizag"] },
  { slug: "vadodara", name: "Vadodara", region: "West", aliases: ["vadodara", "baroda"] },
  { slug: "surat", name: "Surat", region: "West", aliases: ["surat"] },
  { slug: "lucknow", name: "Lucknow", region: "North", aliases: ["lucknow"] },
  { slug: "dehradun", name: "Dehradun", region: "North", aliases: ["dehradun"] },
  { slug: "kanpur", name: "Kanpur", region: "North", aliases: ["kanpur"] },
  { slug: "goa", name: "Goa", region: "West", aliases: ["goa", "panaji", "panjim", "vasco"] },
  { slug: "jodhpur", name: "Jodhpur", region: "North", aliases: ["jodhpur"] },
  { slug: "rajkot", name: "Rajkot", region: "West", aliases: ["rajkot"] },
  { slug: "madurai", name: "Madurai", region: "South", aliases: ["madurai"] },
  { slug: "tiruchirappalli", name: "Tiruchirappalli", region: "South", aliases: ["trichy", "tiruchirappalli"] },
  { slug: "salem", name: "Salem", region: "South", aliases: ["salem"] },
  { slug: "guwahati", name: "Guwahati", region: "East", aliases: ["guwahati", "assam"] },
  { slug: "patna", name: "Patna", region: "East", aliases: ["patna"] },
  { slug: "ranchi", name: "Ranchi", region: "East", aliases: ["ranchi"] },
  { slug: "raipur", name: "Raipur", region: "East", aliases: ["raipur"] },
  { slug: "amritsar", name: "Amritsar", region: "North", aliases: ["amritsar"] },
  { slug: "ludhiana", name: "Ludhiana", region: "North", aliases: ["ludhiana"] },
  { slug: "nashik", name: "Nashik", region: "West", aliases: ["nashik", "nasik"] },
  { slug: "aurangabad", name: "Aurangabad", region: "West", aliases: ["aurangabad", "chhatrapati sambhajinagar"] },
  { slug: "trivandrum", name: "Thiruvananthapuram", region: "South", aliases: [] },
];

// Drop the placeholder duplicate entry, keep the real one.
const GAZETTEER = CITIES.filter((c) => c.aliases.length > 0);

const ALIAS_INDEX = new Map();
for (const c of GAZETTEER) {
  for (const a of c.aliases) ALIAS_INDEX.set(a, c);
}

export const CITY_ORDER = GAZETTEER.map((c) => c.slug);
export const CITY_BY_SLUG = new Map(GAZETTEER.map((c) => [c.slug, c]));
export const CITY_BY_NAME = new Map(GAZETTEER.map((c) => [c.name, c]));

// Split a raw ATS location string into individual tokens.
export function splitLocations(raw) {
  if (!raw) return [];
  return String(raw)
    .split(/[;|/\n]|\s+(?:and|&)\s+|\s*,\s*(?=[A-Z])/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function matchCity(text) {
  if (!text) return null;
  const t = String(text).toLowerCase();
  // Longest alias first so "navi mumbai" wins over "mumbai".
  let best = null;
  for (const [alias, city] of ALIAS_INDEX) {
    if (alias.length <= 2) continue;
    if (t.includes(alias)) {
      if (!best || alias.length > best.alias.length) best = { alias, city };
    }
  }
  return best ? best.city : null;
}

/**
 * Parse a raw location string into canonical cities.
 * Returns { cities: string[], isIndia: boolean, remote: boolean, hybrid: boolean }
 */
export function parseLocations(raw) {
  const rawStr = String(raw || "");
  const lower = rawStr.toLowerCase();
  const remote = /\bremote\b|\bwork from home\b|\bwfh\b|\banywhere\b|\bdistributed\b/.test(lower);
  const hybrid = /\bhybrid\b|\bpartially remote\b|\bflexible\b/.test(lower);

  const found = new Set();
  for (const part of splitLocations(rawStr)) {
    const c = matchCity(part);
    if (c) found.add(c.slug);
  }
  // Whole-string fallback (handles unsplit strings like "BengaluruKarnatakaIndia").
  if (found.size === 0) {
    const c = matchCity(rawStr);
    if (c) found.add(c.slug);
  }

  const isIndia = found.size > 0 || COUNTRY_RE.test(rawStr);
  return { cities: [...found], isIndia, remote, hybrid };
}

// "Remote - India" is still India; "Remote - US" is not.
export function isIndiaRemote(raw) {
  const lower = String(raw || "").toLowerCase();
  if (!/\bremote\b/.test(lower)) return false;
  return COUNTRY_RE.test(lower) || /\bindia\b/.test(lower);
}
