// Classification of raw ATS postings into the board's controlled vocabularies.
//
// Mirrors the reference site's approach: small closed vocabularies for
// level / discipline / focus, derived at ingest time so the client never has to
// guess.
//
// Track decision is TITLE-FIRST. A role counts as engineering only if its title
// matches a known engineering pattern. That is deliberate: descriptions are
// boilerplate-heavy, and matching on them pulls in business roles ("AR Analyst",
// "Deal Desk Analyst", "Content Creator") that merely mention engineers.

// ---------------------------------------------------------------------------
// Level: internship | program | graduate | experienced | unknown
// ---------------------------------------------------------------------------
const LEVEL_RULES = [
  {
    level: "internship",
    re: /\b(intern|internship|summer analyst|summer associate|co[- ]?op|industrial trainee|apprentice|trainee|praktikant|working student|vocational)\b/i,
  },
  {
    level: "program",
    re: /\b((graduate|grad|rotational|leadership|development|training|accelerated|management)\s*(program|programme|scheme)|academy|fellowship|residen(cy|t)|scholar program|rotational engineer)\b/i,
  },
  {
    level: "graduate",
    re: /\b(new grad|newgrad|graduate|university grad|early career|campus hire|entry[- ]level|fresher|freshers|junior|associate (engineer|developer|software|sde|swe|tse|support|architect)|engineer\s+i\b(?!i)|analyst\s+i\b(?!i)|20(2[4-9]) batch|grad scheme)\b/i,
  },
];

const SENIOR_RE = /\b(senior|sr\.?|staff|principal|lead|head of|director|vp|vice president|manager|architect|distinguished|fellow|iii|iv|expert)\b/i;
const ENGINEERING_TITLE_RE = /\b(engineer|engineering|developer|programmer|scientist|architect|sde|swe|analyst|administrator|specialist|consultant|member of technical staff|\bmts\b)\b/i;

export function classifyLevel(title, description = "") {
  for (const r of LEVEL_RULES) if (r.re.test(title)) return r.level;
  if (SENIOR_RE.test(title)) return "experienced";
  if (ENGINEERING_TITLE_RE.test(title)) return "experienced";
  return "unknown";
}

// ---------------------------------------------------------------------------
// Discipline: software | data | ml | infra | security | quant | research | product | other
// ---------------------------------------------------------------------------
// Order matters: first match wins, so narrower disciplines precede "software".
const DISCIPLINE_RULES = [
  {
    d: "security",
    re: /\b(security|infosec|appsec|penetration|pentest|soc analyst|threat|vulnerabilit|identity engineer|iam engineer|fraud engineer|trust and safety|anti[- ]?abuse|grc|cisirt|csirt|detection engineer|red team|blue team|risk engineer)\b/i,
  },
  {
    d: "ml",
    re: /\b(machine learning|mlops|\bml engineer|deep learning|\bnlp\b|natural language|computer vision|\bllm\b|generative ai|genai|ai engineer|ai research|applied ai|artificial intelligence|recommendation|reinforcement learning|perception|speech recognition)\b/i,
  },
  {
    d: "data",
    re: /\b(data engineer|data scientist|data platform|data architect|analytics engineer|data infrastructure|dataops|database engineer|big data|data warehouse|etl engineer|data science)\b/i,
  },
  {
    d: "quant",
    re: /\b(quant|quantitative|trader|trading|market microstructure|algorithmic|execution trader|portfolio|systematic|alpha research|derivatives|market data|fpga|low[- ]latency)\b/i,
  },
  {
    d: "research",
    re: /\b(research scientist|research engineer|researcher|research analyst|r&d|postdoc)\b/i,
  },
  {
    d: "infra",
    re: /\b(devops|sre\b|site reliability|infrastructure|platform engineer|cloud engineer|systems engineer|system administrator|sysadmin|network engineer|kubernetes|datacenter|data centre|data center|hardware engineer|firmware|kernel|compiler|embedded|silicon|asic|vlsi|observabilit|capacity engineer|storage engineer)\b/i,
  },
  {
    d: "product",
    re: /\b(product manager|product owner|program manager|technical program|project manager|scrum master|product designer|\bux\b|\bui\b|designer|solution architect|solutions architect|technical writer|product analyst|delivery manager)\b/i,
  },
  {
    d: "software",
    re: /\b(software|sde\b|swe\b|developer|programmer|full[- ]?stack|back[- ]?end|front[- ]?end|android|\bios\b|mobile|web engineer|architect|technical lead|tech lead|\bqa\b|sdet|test engineer|automation engineer|solutions? engineer|forward deployed|support engineer|implementation engineer|member of technical staff|\bmts\b|engineer)\b/i,
  },
];

export function classifyDiscipline(title, _description = "") {
  for (const r of DISCIPLINE_RULES) if (r.re.test(title)) return r.d;
  return "other";
}

// ---------------------------------------------------------------------------
// Focus: narrower specialisation within the discipline
// ---------------------------------------------------------------------------
export function classifyFocus(title) {
  const t = title.toLowerCase();
  if (/\b(low[- ]?latency|high[- ]?frequency|\bhft\b|market data|fpga|kernel[- ]?bypass|colocation|exchange connectivity|trading systems?)\b/.test(t)) return "low-latency";
  if (/\b(machine learning|\bml\b|\bai\b|deep learning|\bllm\b|\bnlp\b|computer vision|genai|perception|recommendation|artificial intelligence)\b/.test(t)) return "ml-ai";
  if (/\b(data engineer|data scientist|data platform|analytics|warehouse|etl|big data|database)\b/.test(t)) return "data";
  if (/\b(security|infosec|appsec|pentest|threat|fraud|soc\b|identity|iam)\b/.test(t)) return "security";
  if (/\b(backend|back[- ]end|\bapi\b|server[- ]side|microservices)\b/.test(t)) return "backend";
  if (/\b(frontend|front[- ]end|ui engineer|web engineer|react|angular)\b/.test(t)) return "frontend";
  if (/\bfull[- ]?stack\b/.test(t)) return "fullstack";
  if (/\b(android|ios|mobile|flutter|react native)\b/.test(t)) return "mobile";
  if (/\b(platform|infrastructure|infra|devops|sre|site reliability|cloud|kubernetes|observability)\b/.test(t)) return "platform";
  if (/\b(systems?|kernel|firmware|embedded|compiler|distributed|storage|network|capacity|perf)\b/.test(t)) return "systems";
  if (/\b(hardware|silicon|asic|vlsi|chip|rtl|fpga)\b/.test(t)) return "hardware";
  if (/\b(support|solutions? engineer|forward deployed|implementation|field engineer|technical support|customer engineer)\b/.test(t)) return "support";
  if (/\b(quant|trader|trading|strategy|research)\b/.test(t)) return "quant";
  if (/\b(qa|sdet|test|automation)\b/.test(t)) return "qa";
  return null;
}

// ---------------------------------------------------------------------------
// Business functions: excluded from an engineering board.
// Checked BEFORE discipline, so "Marketing Data Analyst" is still business.
// ---------------------------------------------------------------------------
const BUSINESS_RE =
  /\b(sales|account executive|account manager|accounts?\s+(specialist|manager|representative)|account development|business development|partnerships?|alliances|marketing|demand gen|growth marketing|brand|content (writer|marketer|strategist|creator)|copywriter|social media|communications?|public relations|recruit|talent acquisition|talent partner|sourcer|human resources|\bhr\b|people (ops|operations|partner|team)|payroll|compensation|benefits|finance|financial analyst|accounting|accountant|accounts (payable|receivable)|\baudit|taxation|\btax\b|treasury|investor relations|legal|counsel|paralegal|compliance officer|procurement|purchasing|facilities|office manager|receptionist|administrative|executive assistant|customer success manager|client relationship|customer support representative|customer care|supply chain|logistics|warehouse|store manager|retail|merchandis|teacher|instructor|professor|admissions|events? manager|community manager|inside sales|deal desk|operations analyst|business analyst|customer support|real estate|content creator|programmatic|onboarding analyst|technical account|customer lifecycle|enablement)\b/i;

// Pre-sales / solutions engineering is technical; keep it.
const TECHNICAL_OVERRIDE_RE =
  /\b((sales|solutions|solution|presales|pre[- ]?sales|forward deployed|field|partner|customer)\s+(engineer|architect|consultant)|technical support engineer|support engineer|solutions? architect|customer engineer|member of technical staff|\bmts\b)\b/i;

export function classifyTrack(title, description = "") {
  if (TECHNICAL_OVERRIDE_RE.test(title)) return "engineering";
  if (BUSINESS_RE.test(title)) return "business";
  const d = classifyDiscipline(title, description);
  if (d === "product") return "product";
  if (d === "other") return "business";
  return "engineering";
}

// ---------------------------------------------------------------------------
// Work mode
// ---------------------------------------------------------------------------
export function classifyWorkMode(rawLocation, title = "", description = "") {
  const t = `${rawLocation} ${title}`.toLowerCase();
  if (/\bhybrid\b/.test(t)) return "hybrid";
  if (/\bremote\b|\bwfh\b|work from home|\banywhere\b|fully distributed/.test(t)) return "remote";
  if (/\bon[- ]?site\b|\bin[- ]?office\b|\bin office\b/.test(t)) return "onsite";
  const d = description.toLowerCase();
  if (/\bhybrid\b/.test(d)) return "hybrid";
  if (/\bfully remote\b|\bremote[- ]first\b|\bwork from home\b/.test(d)) return "remote";
  return rawLocation ? "onsite" : "unknown";
}

// ---------------------------------------------------------------------------
// Walk-in interviews / hiring events
//
// The India-specific facet. ATS feeds rarely carry true walk-ins, so the
// classifier reads the description body for the phrasing employers use:
// "walk-in interview", "walk-in drive", "mega drive", "campus drive",
// "off-campus", "open house", "hiring event", "job fair".
// ---------------------------------------------------------------------------
const WALKIN_RULES = [
  { type: "walk-in", re: /\b(walk[-\s]?in|walkin)\s*(interview|drive|recruitment|hiring|event)?\b/i },
  { type: "walk-in", re: /\b(direct walk[-\s]?in|spot offer|immediate joining drive)\b/i },
  { type: "campus-drive", re: /\b(campus (drive|hiring|placement|recruitment)|off[-\s]?campus|on[-\s]?campus)\b/i },
  { type: "hiring-event", re: /\b(hiring (event|fest|challenge|drive|marathon)|mega (drive|hiring|job)|job fair|open house|recruitment drive|career fair|hiring spree)\b/i },
];

export function classifyEvent(title, description = "") {
  const t = `${title}\n${description}`;
  for (const r of WALKIN_RULES) if (r.re.test(t)) return r.type;
  return null;
}

// ---------------------------------------------------------------------------
// Aggregate
// ---------------------------------------------------------------------------
export function classifyPosting({ title, description = "", location = "" }) {
  const eventType = classifyEvent(title, description);
  return {
    level: classifyLevel(title, description),
    discipline: classifyDiscipline(title, description),
    focus: classifyFocus(title),
    track: classifyTrack(title, description),
    work_mode: classifyWorkMode(location, title, description),
    event_type: eventType,
    walk_in: eventType !== null,
  };
}
