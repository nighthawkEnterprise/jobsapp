import type { ScannedJob, JobSalary } from './scanner';
import type { Preferences, Story } from './store';

// ── Title parsing ──────────────────────────────────────────────────

const ABBREV: Record<string, string> = {
  pm:  'product manager',
  tpm: 'technical program manager',
  em:  'engineering manager',
  gm:  'general manager',
};

const EXPANSIONS: Record<string, string> = {
  ml:     'machine learning',
  ai:     'artificial intelligence',
  devex:  'developer experience',
  devx:   'developer experience',
  devrel: 'developer relations',
  infra:  'infrastructure',
};

const TOKEN_SPLIT = /[\s/,()\-–—.]+/;

export function expandTitle(title: string): string {
  return title.toLowerCase()
    .split(TOKEN_SPLIT)
    .filter(Boolean)
    .map(w => ABBREV[w] ?? w)
    .map(w => EXPANSIONS[w] ?? w)
    .join(' ');
}

const SENIORITY = new Set([
  'senior', 'sr', 'staff', 'principal', 'lead', 'junior', 'jr',
  'associate', 'assoc', 'head', 'director', 'dir', 'vp', 'vice', 'president', 'group', 'intern',
]);

export function coreRole(expanded: string): string {
  return expanded.split(/\s+/).filter(w => !SENIORITY.has(w)).join(' ');
}

const LEVEL_RANK: Record<string, number> = {
  intern: 0,
  junior: 1, jr: 1, associate: 1, assoc: 1,
  senior: 3, sr: 3,
  staff: 4, lead: 4,
  principal: 5, group: 5,
  director: 6, head: 6, dir: 6,
  vp: 7,
  president: 8,
};

/** Returns the highest-ranked seniority token found in the title, or 2 (plain) if none. */
export function parseSeniority(title: string): { rank: number; label: string } {
  const lower = title.toLowerCase();
  if (/\bvice[\s-]*president\b/.test(lower)) return { rank: 7, label: 'vice president' };
  const tokens = lower.split(TOKEN_SPLIT).filter(Boolean);
  let bestRank: number | null = null;
  let bestLabel = '';
  for (const t of tokens) {
    const rank = LEVEL_RANK[t];
    if (rank === undefined) continue;
    if (bestRank === null || rank > bestRank) {
      bestRank = rank;
      bestLabel = t;
    }
  }
  if (bestRank === null) return { rank: 2, label: '' };
  return { rank: bestRank, label: bestLabel };
}

// ── Title relevance filter (hard filter before scoring) ───────────

const ROLE_BASE_PHRASES = ['product manager', 'program manager', 'engineering manager', 'general manager'];

export interface PrefKeyword { full: string; core: string }

function prefKeywords(jobTitles: string[]): PrefKeyword[] {
  return jobTitles.map(pt => {
    const full = expandTitle(pt);
    return { full, core: coreRole(full) };
  });
}

export function isRelevantTitle(title: string, prefs: Preferences): boolean {
  if (prefs.jobTitles.length === 0) return true;
  const t = expandTitle(title);
  const tWords = new Set(t.split(/\W+/).filter(Boolean));
  return prefKeywords(prefs.jobTitles).some(({ full, core }) => {
    if (t.includes(full) || (core.length > 3 && t.includes(core))) return true;
    const prefWords = full.split(/\W+/).filter(Boolean);
    if (!prefWords.every(w => tWords.has(w))) return false;
    return ROLE_BASE_PHRASES.some(phrase => full.includes(phrase) && t.includes(phrase));
  });
}

// ── Work-style detection ──────────────────────────────────────────

export type WorkStyle = 'remote' | 'hybrid' | 'onsite';

function detectWorkStyle(locationStr: string): { style: WorkStyle | null; remainingLocation: string } {
  if (!locationStr) return { style: null, remainingLocation: '' };
  const lower = locationStr.toLowerCase();
  let style: WorkStyle | null = null;
  if (/\bremote\b/.test(lower)) style = 'remote';
  else if (/\bhybrid\b/.test(lower)) style = 'hybrid';
  else if (/\bonsite\b/.test(lower) || /\bin[-\s]?office\b/.test(lower)) style = 'onsite';
  const remaining = locationStr
    .replace(/\b(remote|hybrid|onsite|in[-\s]?office)\b/gi, '')
    .replace(/[([{]\s*[)\]}]/g, '')        // drop brackets left empty by the strip above, e.g. "Seattle, WA ()"
    .replace(/\s*,\s*(?=,|$)/g, '')         // drop separators orphaned by the strip, e.g. "Seattle, WA, "
    .replace(/^[\s,—–\-]+|[\s,—–\-]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return { style, remainingLocation: remaining };
}

function normalizeWorkStyle(s: string): WorkStyle | null {
  const lower = s.toLowerCase().trim();
  if (lower === 'remote') return 'remote';
  if (lower === 'hybrid') return 'hybrid';
  if (lower === 'onsite' || lower === 'in-office' || lower === 'in office') return 'onsite';
  return null;
}

// ── Salary helpers ────────────────────────────────────────────────

function formatSalary(s: JobSalary): string {
  const k = (n: number) => `$${Math.round(n / 1000)}k`;
  if (s.min && s.max) return `${k(s.min)}–${k(s.max)}`;
  if (s.min) return `${k(s.min)}+`;
  if (s.max) return `up to ${k(s.max)}`;
  return 'unspecified';
}

function formatFloor(n: number): string {
  return `$${Math.round(n / 1000)}k`;
}

// ── Scoring context ───────────────────────────────────────────────

export interface DomainEntry { value: string; fromStory: boolean }

export interface ScoringContext {
  targetCompanies: Set<string>;
  keywords: PrefKeyword[];
  domains: DomainEntry[];
  competencies: string[];
  locationPreferences: string[];
  workStyle: WorkStyle | null;
  salaryFloor: number;
  targetSeniorityRanks: Set<number>;
  targetSeniorityLabels: string[];
}

function uniqueCaseInsensitive(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of values) {
    const key = v.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(v.trim());
  }
  return out;
}

export function buildScoringContext(prefs: Preferences, stories: Story[]): ScoringContext {
  const prefDomains = prefs.domainsOfInterest ?? [];
  const storyDomains = stories.flatMap(s => s.domains ?? []);
  const storyCompetencies = stories.flatMap(s => s.competencies ?? []);

  const seenDomains = new Set<string>();
  const domains: DomainEntry[] = [];
  for (const v of prefDomains) {
    const key = v.trim().toLowerCase();
    if (!key || seenDomains.has(key)) continue;
    seenDomains.add(key);
    domains.push({ value: v.trim(), fromStory: false });
  }
  for (const v of storyDomains) {
    const key = v.trim().toLowerCase();
    if (!key || seenDomains.has(key)) continue;
    seenDomains.add(key);
    domains.push({ value: v.trim(), fromStory: true });
  }

  const targetSeniorityRanks = new Set<number>();
  const targetSeniorityLabels = new Set<string>();
  for (const t of prefs.jobTitles ?? []) {
    const { rank, label } = parseSeniority(t);
    if (label) {
      targetSeniorityRanks.add(rank);
      targetSeniorityLabels.add(label);
    }
  }

  return {
    targetCompanies: new Set((prefs.targetCompanies ?? []).map(c => c.toLowerCase())),
    keywords: prefKeywords(prefs.jobTitles ?? []),
    domains,
    competencies: uniqueCaseInsensitive(storyCompetencies),
    locationPreferences: prefs.locationPreferences ?? [],
    workStyle: normalizeWorkStyle(prefs.workStyle ?? ''),
    salaryFloor: prefs.salaryFloor ?? 0,
    targetSeniorityRanks,
    targetSeniorityLabels: Array.from(targetSeniorityLabels),
  };
}

// ── The scoring function ──────────────────────────────────────────

export function scoreScanResult(job: ScannedJob, ctx: ScoringContext): { score: number; reasons: string[] } {
  let score = 2.0;
  const reasons: string[] = [];
  const expandedTitle = expandTitle(job.title);

  // Target company
  if (ctx.targetCompanies.has(job.company.toLowerCase())) {
    score += 0.6;
    reasons.push(`"${job.company}" is one of your target companies (+0.6)`);
  }

  // Title role match
  const matchedFull = ctx.keywords.find(({ full }) => expandedTitle.includes(full));
  const matchedCore = !matchedFull && ctx.keywords.find(({ core }) => core.length > 3 && expandedTitle.includes(core));
  if (matchedFull) {
    score += 0.7;
    reasons.push(`Title matches preferred role "${matchedFull.full}" (+0.7)`);
  } else if (matchedCore) {
    score += 0.35;
    reasons.push(`Title contains role keyword "${matchedCore.core}" (+0.35)`);
  }

  // Domain match (prefs ∪ story domains)
  const domainHit = ctx.domains.find(d => expandedTitle.includes(d.value.toLowerCase()));
  if (domainHit) {
    score += 0.3;
    const label = domainHit.fromStory ? `story-domain "${domainHit.value}"` : `domain of interest "${domainHit.value}"`;
    reasons.push(`Title mentions ${label} (+0.3)`);
  }

  // Competency soft signal (capped)
  let compBonus = 0;
  for (const c of ctx.competencies) {
    if (compBonus >= 0.1) break;
    if (expandedTitle.includes(c.toLowerCase())) {
      compBonus += 0.1;
      reasons.push(`Title mentions story-competency "${c}" (+0.1)`);
    }
  }
  score += compBonus;

  // Work style and location (routed)
  const { style: jobStyle, remainingLocation } = detectWorkStyle(job.location ?? '');

  if (ctx.workStyle) {
    if (jobStyle && jobStyle === ctx.workStyle) {
      score += 0.2;
      reasons.push(`${capitalize(jobStyle)} role matches your work-style preference (+0.2)`);
    } else if (jobStyle && jobStyle !== ctx.workStyle) {
      score -= 0.2;
      reasons.push(`Role is ${jobStyle}, you prefer ${ctx.workStyle} (−0.2)`);
    }
  }

  if (remainingLocation) {
    const matchedLoc = ctx.locationPreferences.find(loc => {
      const l = loc.toLowerCase();
      if (l === 'remote' || l === 'hybrid' || l === 'onsite') return false; // routed elsewhere
      return remainingLocation.toLowerCase().includes(l);
    });
    if (matchedLoc) {
      score += 0.3;
      reasons.push(`Location "${remainingLocation}" matches preference "${matchedLoc}" (+0.3)`);
    } else if (ctx.locationPreferences.length > 0) {
      reasons.push(`Location "${remainingLocation}" doesn't match your preferences (±0)`);
    }
  } else if (!jobStyle) {
    // Truly no location info — keep the "benefit of the doubt" bump from the original scorer.
    score += 0.1;
    reasons.push('Location not listed — benefit of the doubt (+0.1)');
  }

  // Salary fit
  if (ctx.salaryFloor > 0 && job.salary) {
    const min = job.salary.min ?? 0;
    const max = job.salary.max ?? min;
    if (max > 0 && max < ctx.salaryFloor) {
      score -= 0.4;
      reasons.push(`Salary ${formatSalary(job.salary)} is below your ${formatFloor(ctx.salaryFloor)} floor (−0.4)`);
    } else if (min >= ctx.salaryFloor * 1.2) {
      score += 0.3;
      reasons.push(`Salary ${formatSalary(job.salary)} is well above your ${formatFloor(ctx.salaryFloor)} floor (+0.3)`);
    } else if (min >= ctx.salaryFloor) {
      score += 0.2;
      reasons.push(`Salary ${formatSalary(job.salary)} meets your ${formatFloor(ctx.salaryFloor)} floor (+0.2)`);
    }
  }

  // Seniority alignment
  if (ctx.targetSeniorityRanks.size > 0) {
    const { rank: jobRank, label: jobLabel } = parseSeniority(job.title);
    if (ctx.targetSeniorityRanks.has(jobRank)) {
      score += 0.4;
      const targetText = ctx.targetSeniorityLabels.join('/');
      reasons.push(`${capitalize(jobLabel || 'Plain')} seniority matches your target (${targetText}) (+0.4)`);
    } else {
      const lowest = Math.min(...ctx.targetSeniorityRanks);
      const highest = Math.max(...ctx.targetSeniorityRanks);
      if (jobRank < lowest - 1) {
        score -= 0.5;
        reasons.push(`Seniority is ${lowest - jobRank} ranks below your target — likely too junior (−0.5)`);
      } else if (jobRank > highest) {
        score -= 0.3;
        reasons.push(`Seniority is ${jobRank - highest} rank${jobRank - highest > 1 ? 's' : ''} above your target — stretch role (−0.3)`);
      }
    }
  }

  // Freshness
  if (job.postedAt) {
    const ageMs = Date.now() - new Date(job.postedAt).getTime();
    const ageHours = ageMs / 3_600_000;
    const ageDays = ageHours / 24;
    if (ageHours < 24 && ageHours >= 0) {
      score += 0.1;
      const hrs = Math.max(1, Math.round(ageHours));
      reasons.push(`Posted ${hrs} hour${hrs === 1 ? '' : 's'} ago (+0.1)`);
    } else if (ageDays > 90) {
      score -= 0.2;
      reasons.push(`Posted ${Math.round(ageDays)} days ago — likely stale (−0.2)`);
    }
  }

  const clamped = Math.max(1.0, Math.min(5.0, Math.round(score * 10) / 10));
  return { score: clamped, reasons };
}

function capitalize(s: string): string {
  if (!s) return s;
  return s[0].toUpperCase() + s.slice(1);
}
