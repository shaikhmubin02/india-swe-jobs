// Source registry.
//
// Every entry below was verified live against its board API. The board tokens
// were recovered from the reference site (for the quant/AI firms) and then
// discovered by sweeping candidate tokens (for the tech firms). An entry is
// kept even when it currently yields no India engineering roles, provided the
// board is genuinely the employer's (see "thin" below) — so future reqs are
// picked up on the next refresh without anyone having to re-run discovery.
//
// Sector:    quant | tech
// Category:  hft | quant-research | ai-lab | global-tech | indian-product | services
//
// Adding a firm is one line. `type` selects the adapter:
//   greenhouse | ashby | lever   -> native board APIs (preferred)
//   json                         -> any REST endpoint + field mapping (see jsonMap)
//   rss                          -> RSS/Atom feed (see rssMap)
//   manual                       -> entries in data/manual-jobs.json
//
// Big Indian services firms (TCS/Infosys/Wipro/Accenture/...) and the large
// hyperscalers run in-house ATSs (Workday/Taleo/SuccessFactors) that expose no
// public board API; they are intentionally represented through the `manual`
// source plus the walk-in feed, which is where their walk-in drives surface.

/** @typedef {{type:string, token?:string, name:string, slug:string, sector:string, category:string, careers?:string, url?:string, jsonMap?:object, rssMap?:object, tags?:string[]}} Source */

export const SOURCES = [
  // ---------------------------------------------------------------- HFT / quant
  { type: "greenhouse", token: "imc", name: "IMC Trading", slug: "imc-trading", sector: "quant", category: "hft", careers: "https://www.imc.com/us/careers/" },
  { type: "greenhouse", token: "point72", name: "Point72", slug: "point72", sector: "quant", category: "hft", careers: "https://point72.com/careers/" },
  { type: "greenhouse", token: "squarepointcapital", name: "Squarepoint Capital", slug: "squarepoint-capital", sector: "quant", category: "hft", careers: "https://www.squarepoint-capital.com/careers" },
  { type: "greenhouse", token: "towerresearchcapital", name: "Tower Research Capital", slug: "tower-research-capital", sector: "quant", category: "hft", careers: "https://www.tower-research.com/careers/" },
  { type: "greenhouse", token: "jumptrading", name: "Jump Trading", slug: "jump-trading", sector: "quant", category: "hft", careers: "https://www.jumptrading.com/careers" },
  { type: "greenhouse", token: "optiverus", name: "Optiver", slug: "optiver", sector: "quant", category: "hft", careers: "https://www.optiver.com/working-at-optiver/career-opportunities/" },
  { type: "greenhouse", token: "davinciderivatives", name: "Da Vinci Derivatives", slug: "da-vinci-derivatives", sector: "quant", category: "hft", careers: "https://davinciderivatives.com/careers" },
  { type: "greenhouse", token: "alphagrepsecurities", name: "AlphaGrep Securities", slug: "alphagrep-securities", sector: "quant", category: "hft", careers: "https://www.alphagrep.com/careers" },
  { type: "greenhouse", token: "worldquant", name: "WorldQuant", slug: "worldquant", sector: "quant", category: "quant-research", careers: "https://www.worldquant.com/careers/" },

  // ------------------------------------------------------------------- AI labs
  { type: "ashby", token: "openai", name: "OpenAI", slug: "openai", sector: "tech", category: "ai-lab", careers: "https://openai.com/careers/" },
  { type: "greenhouse", token: "anthropic", name: "Anthropic", slug: "anthropic", sector: "tech", category: "ai-lab", careers: "https://www.anthropic.com/careers" },
  { type: "ashby", token: "cursor", name: "Cursor", slug: "cursor", sector: "tech", category: "ai-lab", careers: "https://cursor.com/careers" },
  { type: "ashby", token: "elevenlabs", name: "ElevenLabs", slug: "elevenlabs", sector: "tech", category: "ai-lab", careers: "https://elevenlabs.io/careers" },
  { type: "ashby", token: "harvey", name: "Harvey", slug: "harvey", sector: "tech", category: "ai-lab", careers: "https://www.harvey.ai/careers" },
  { type: "greenhouse", token: "togetherai", name: "Together AI", slug: "together-ai", sector: "tech", category: "ai-lab", careers: "https://www.together.ai/careers" },
  { type: "greenhouse", token: "scaleai", name: "Scale AI", slug: "scale-ai", sector: "tech", category: "ai-lab", careers: "https://scale.com/careers" },

  // -------------------------------------------------------------- global tech
  { type: "greenhouse", token: "databricks", name: "Databricks", slug: "databricks", sector: "tech", category: "global-tech", careers: "https://www.databricks.com/company/careers" },
  { type: "greenhouse", token: "mongodb", name: "MongoDB", slug: "mongodb", sector: "tech", category: "global-tech", careers: "https://www.mongodb.com/careers" },
  { type: "greenhouse", token: "zscaler", name: "Zscaler", slug: "zscaler", sector: "tech", category: "global-tech", careers: "https://www.zscaler.com/careers" },
  { type: "greenhouse", token: "stripe", name: "Stripe", slug: "stripe", sector: "tech", category: "global-tech", careers: "https://stripe.com/jobs" },
  { type: "greenhouse", token: "gitlab", name: "GitLab", slug: "gitlab", sector: "tech", category: "global-tech", careers: "https://about.gitlab.com/jobs/" },
  { type: "greenhouse", token: "rubrik", name: "Rubrik", slug: "rubrik", sector: "tech", category: "global-tech", careers: "https://www.rubrik.com/company/careers" },
  { type: "greenhouse", token: "alphasense", name: "AlphaSense", slug: "alphasense", sector: "tech", category: "global-tech", careers: "https://www.alpha-sense.com/careers/" },
  { type: "greenhouse", token: "payoneer", name: "Payoneer", slug: "payoneer", sector: "tech", category: "global-tech", careers: "https://www.payoneer.com/careers/" },
  { type: "greenhouse", token: "netskope", name: "Netskope", slug: "netskope", sector: "tech", category: "global-tech", careers: "https://www.netskope.com/company/careers" },
  { type: "greenhouse", token: "elastic", name: "Elastic", slug: "elastic", sector: "tech", category: "global-tech", careers: "https://www.elastic.co/careers" },
  { type: "greenhouse", token: "twilio", name: "Twilio", slug: "twilio", sector: "tech", category: "global-tech", careers: "https://www.twilio.com/en-us/company/jobs" },
  { type: "greenhouse", token: "datadog", name: "Datadog", slug: "datadog", sector: "tech", category: "global-tech", careers: "https://careers.datadoghq.com/" },
  { type: "greenhouse", token: "coinbase", name: "Coinbase", slug: "coinbase", sector: "tech", category: "global-tech", careers: "https://www.coinbase.com/careers" },
  { type: "greenhouse", token: "agoda", name: "Agoda", slug: "agoda", sector: "tech", category: "global-tech", careers: "https://careers.agoda.com/" },
  { type: "greenhouse", token: "singlestore", name: "SingleStore", slug: "singlestore", sector: "tech", category: "global-tech", careers: "https://www.singlestore.com/careers/" },
  { type: "greenhouse", token: "commvault", name: "Commvault", slug: "commvault", sector: "tech", category: "global-tech", careers: "https://www.commvault.com/careers" },
  { type: "greenhouse", token: "solarwinds", name: "SolarWinds", slug: "solarwinds", sector: "tech", category: "global-tech", careers: "https://www.solarwinds.com/company/careers" },
  { type: "greenhouse", token: "newrelic", name: "New Relic", slug: "new-relic", sector: "tech", category: "global-tech", careers: "https://newrelic.com/about/careers" },
  { type: "greenhouse", token: "coursera", name: "Coursera", slug: "coursera", sector: "tech", category: "global-tech", careers: "https://careers.coursera.com/" },
  { type: "ashby", token: "snowflake", name: "Snowflake", slug: "snowflake", sector: "tech", category: "global-tech", careers: "https://careers.snowflake.com/" },
  { type: "greenhouse", token: "airbnb", name: "Airbnb", slug: "airbnb", sector: "tech", category: "global-tech", careers: "https://careers.airbnb.com/" },
  { type: "greenhouse", token: "yugabyte", name: "Yugabyte", slug: "yugabyte", sector: "tech", category: "global-tech", careers: "https://www.yugabyte.com/careers/" },
  { type: "greenhouse", token: "sumologic", name: "Sumo Logic", slug: "sumo-logic", sector: "tech", category: "global-tech", careers: "https://www.sumologic.com/company/careers/" },
  { type: "greenhouse", token: "adyen", name: "Adyen", slug: "adyen", sector: "tech", category: "global-tech", careers: "https://careers.adyen.com/" },
  { type: "greenhouse", token: "vercel", name: "Vercel", slug: "vercel", sector: "tech", category: "global-tech", careers: "https://vercel.com/careers" },
  { type: "ashby", token: "notion", name: "Notion", slug: "notion", sector: "tech", category: "global-tech", careers: "https://www.notion.com/careers" },
  { type: "greenhouse", token: "cockroachlabs", name: "Cockroach Labs", slug: "cockroach-labs", sector: "tech", category: "global-tech", careers: "https://www.cockroachlabs.com/careers/" },
  { type: "greenhouse", token: "figma", name: "Figma", slug: "figma", sector: "tech", category: "global-tech", careers: "https://www.figma.com/careers/" },
  { type: "greenhouse", token: "duolingo", name: "Duolingo", slug: "duolingo", sector: "tech", category: "global-tech", careers: "https://careers.duolingo.com/" },
  { type: "lever", token: "spotify", name: "Spotify", slug: "spotify", sector: "tech", category: "global-tech", careers: "https://www.lifeatspotify.com/jobs" },

  // ------------------------------------------------------------ Indian product
  { type: "lever", token: "paytm", name: "Paytm", slug: "paytm", sector: "tech", category: "indian-product", careers: "https://paytm.com/careers" },
  { type: "lever", token: "meesho", name: "Meesho", slug: "meesho", sector: "tech", category: "indian-product", careers: "https://www.meesho.io/jobs" },
  { type: "lever", token: "cred", name: "CRED", slug: "cred", sector: "tech", category: "indian-product", careers: "https://careers.cred.club/" },
  { type: "lever", token: "zeta", name: "Zeta", slug: "zeta", sector: "tech", category: "indian-product", careers: "https://www.zeta.tech/careers" },
  { type: "lever", token: "mindtickle", name: "Mindtickle", slug: "mindtickle", sector: "tech", category: "indian-product", careers: "https://www.mindtickle.com/careers/" },
  { type: "greenhouse", token: "highradius", name: "HighRadius", slug: "highradius", sector: "tech", category: "indian-product", careers: "https://www.highradius.com/careers/" },
  { type: "greenhouse", token: "inmobi", name: "InMobi", slug: "inmobi", sector: "tech", category: "indian-product", careers: "https://www.inmobi.com/company/careers/" },
  { type: "greenhouse", token: "glance", name: "Glance", slug: "glance", sector: "tech", category: "indian-product", careers: "https://www.glance.com/careers" },
  { type: "greenhouse", token: "netradyne", name: "Netradyne", slug: "netradyne", sector: "tech", category: "indian-product", careers: "https://www.netradyne.com/careers" },
  { type: "greenhouse", token: "groww", name: "Groww", slug: "groww", sector: "tech", category: "indian-product", careers: "https://groww.in/careers" },
  { type: "greenhouse", token: "druva", name: "Druva", slug: "druva", sector: "tech", category: "indian-product", careers: "https://www.druva.com/company/careers/" },
  { type: "ashby", token: "atlan", name: "Atlan", slug: "atlan", sector: "tech", category: "indian-product", careers: "https://atlan.com/careers/" },
  { type: "ashby", token: "sardine", name: "Sardine", slug: "sardine", sector: "tech", category: "indian-product", careers: "https://www.sardine.ai/careers" },

  // ------------------------------------------------------------ services / GCC
  // thin: verified real (apply URLs resolve through thoughtworks.com), but the
  // India entity posts to a non-public board — only a single Bangalore req was
  // listed here. Kept so it starts working the moment India reqs appear.
  { type: "greenhouse", token: "thoughtworks", name: "Thoughtworks", slug: "thoughtworks", sector: "tech", category: "services", careers: "https://www.thoughtworks.com/careers" },

  // ------------------------------------------------------------------- manual
  // Operator-curated walk-in drives and postings from firms without a public
  // board API. Populated from data/manual-jobs.json (see README).
  { type: "manual", name: "Curated & walk-in drives", slug: "curated", sector: "tech", category: "services" },
];

export const SOURCE_BY_KEY = new Map(SOURCES.map((s) => [`${s.type}:${s.token || s.slug}`, s]));

export function sourceKey(s) {
  return `${s.type}:${s.token || s.slug}`;
}
