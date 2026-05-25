# Discovery Scoring Upgrade — Design

**Date:** 2026-05-25
**Status:** Approved — pending implementation plan
**Scope:** Rule-based scoring used by ATS discovery scans and as the pipeline's pre-LLM fallback score

## Goal

Bring the rule-based discovery score closer to the LLM-based pipeline score by mining signals we already collect but don't use today. **No LLM calls; $0 ongoing cost.** Expected quality gain: ~70–80% of the LLM scoring quality for the firehose.

## Non-goals

- LLM-scoring discovered jobs (separate option, considered and rejected for now)
- Anti-keyword / avoid-list (deferred — needs new prefs UI)
- Changing how pipeline jobs get their LLM dimensions (existing `fetchAndScore` flow stays)
- Reworking the `/relevant-jobs` page UI (score breakdown drawer auto-picks up new reasons)

## Where the work lives

### New module: `lib/discovery-scoring.ts`

Pure functions, no side effects, easy to unit-test:

- `parseSeniority(title: string): SeniorityLevel | null`
- `buildScoringContext(prefs, stories): ScoringContext` — pre-computes the dictionaries used per-job (target companies set, role keywords with expansions, domain/competency unions, target seniority set, salary floor, work style)
- `scoreScanResult(job: ScannedJob, ctx: ScoringContext): { score: number; reasons: string[] }`

### Modified: `app/api/scan/route.ts`

- The local `scoreScanResult` is removed and replaced by an import from `lib/discovery-scoring.ts`.
- The `discover` action's `Promise.all` adds one fetch: `getStories(userId)`.
- A single `ScoringContext` is built before the portal loop and reused across every job scored in that scan.

### Reused by pipeline fallback

Pipeline cards use `job.score` (set from `discoverScore` when added) as the fallback when `dimensions` is absent. No code change needed — the upgraded discovery score flows into `job.score` automatically.

## Scoring formula

Base: **3.0**. Floor: **1.0**. Cap: **5.0**.

Each signal contributes a delta and a reason string. Reasons populate `scoreReasons[]` and are surfaced verbatim in the existing UI breakdown drawer.

| Signal | Bonus | Penalty | Source |
|---|---|---|---|
| Target company match | +1.0 | — | `prefs.targetCompanies` |
| Title role full match | +1.0 | — | `prefs.jobTitles` (expanded + stemmed) |
| Title role partial match | +0.5 | — | `prefs.jobTitles` (core role only) |
| Domain match | +0.3 | — | Union of `prefs.domainsOfInterest` and `stories[*].domains` |
| Competency match | +0.1 each, cap +0.3 | — | `stories[*].competencies` |
| Location match | +0.5 | — | `prefs.locationPreferences` (geo only — see work-style routing below) |
| Salary at/above floor | +0.3 | — | `prefs.salaryFloor` vs `job.salary.min` |
| Salary ≥ 120% of floor | +0.5 (replaces +0.3) | — | same |
| Salary max below floor | — | −0.5 | `prefs.salaryFloor` vs `job.salary.max` |
| Seniority in target set | +0.3 | — | parsed seniority of `job.title` vs parsed seniority of `prefs.jobTitles` |
| Seniority 2+ ranks below lowest target | — | −0.5 | same |
| Seniority 1+ rank above highest target | — | −0.3 | same |
| Work style match | +0.3 | −0.2 (mismatch) | `prefs.workStyle` vs detected remote/hybrid/onsite |
| Posted < 24h | +0.2 | — | `job.postedAt` |
| Posted > 90d | — | −0.2 | same |
| Posted not listed | (no change) | — | "Posted date not listed (±0)" |

Behavior unchanged for: location-not-listed "benefit of the doubt" (+0.1), title-irrelevance hard filter (`isRelevantTitle`), excluded-companies hard filter.

## Title parsing

### Seniority ranks

```
0  intern
1  junior, jr, associate, assoc
2  (plain — no seniority modifier)
3  senior, sr
4  staff, lead
5  principal, group
6  director, head
7  vp, vice president
8  president
```

Parser tokenizes a title on whitespace, `/`, `,`, `-`, `(`, `)`. Picks the **highest** rank present. "Sr Staff PM" → 4 (staff wins). "Group PM" → 5. "Product Manager" → 2.

### Expansion map (additive on top of existing `ABBREV`)

```ts
const EXPANSIONS: Record<string, string[]> = {
  'machine learning':       ['ml'],
  'artificial intelligence':['ai'],
  'developer experience':   ['devex', 'devx'],
  'developer relations':    ['devrel'],
  'infrastructure':         ['infra'],
  'platform':               ['plat'],          // weak; only matches if surrounded
  'data platform':          ['data plat'],
  'identity':               ['idp', 'auth'],
};
```

Matching is bidirectional: looking for any variant in the title satisfies a preference written in canonical form, and vice versa.

### Tokenization

`normalizeTitle(s: string): { full: string; tokens: Set<string> }`
- Lowercases
- Splits on `/,-()`-and-whitespace boundaries
- Expands abbreviations both ways
- Returns the normalized full string (for substring match) and a token set (for word-set match)

## Work-style routing (no double-count)

Today, "Remote" in `job.location` triggers the location-match bonus (+0.5). Going forward:
- If the job's location string contains `remote` / `hybrid` / `onsite` (case-insensitive), strip that token before the **location** match and feed it to **work-style** scoring instead.
- Location string with both "Remote" and a city (e.g., "Remote — San Francisco preferred"): both signals score independently.
- `prefs.workStyle` is a single string like `'remote'`, `'hybrid'`, `'onsite'`, or empty. If empty, work-style scoring is skipped entirely.

## Story integration

Stories carry richer domain/competency tags than the user types into prefs. At scan time:

- `domainDict = unique(prefs.domainsOfInterest ∪ stories[*].domains)` — same +0.3 bonus weight
- `competencyDict = unique(stories[*].competencies)` — softer +0.1 per match (cap +0.3)

This means a user who never explicitly typed "OIDC" into `domainsOfInterest` but has a story tagged with that domain will still get OIDC-mentioning roles bumped.

Deduplication is case-insensitive on trimmed strings.

## Data flow change

```diff
  if (body.action === 'discover') {
-   const [prefs, jobs, dismissedUrls, userPortals, directoryPortals, oldCache] =
+   const [prefs, jobs, dismissedUrls, userPortals, directoryPortals, oldCache, stories] =
      await Promise.all([
        getPreferences(userId),
        getJobs(userId),
        getDismissedUrls(userId),
        getPortals(userId),
        getDirectoryPortals(),
        getScanCache(userId),
+       getStories(userId),
      ]);
+   const ctx = buildScoringContext(prefs, stories);
    ...
    for (const job of result.jobs) {
      if (!isRelevantTitle(job.title, prefs)) continue;
      if (seenUrls.has(job.url)) continue;
      seenUrls.add(job.url);
-     const { score, reasons } = scoreScanResult(job, prefs);
+     const { score, reasons } = scoreScanResult(job, ctx);
      ...
    }
  }
```

## Reasons output (examples)

Reasons stay human-readable; the existing `/relevant-jobs` breakdown drawer renders them as-is.

- `"\"Databricks\" is one of your target companies (+1.0)"`
- `"Title matches preferred role \"staff product manager\" (+1.0)"`
- `"Title mentions story-domain \"OIDC\" (+0.3)"`
- `"Title mentions story-competency \"Platform Strategy\" (+0.1)"`
- `"Location \"Seattle, WA\" matches preference (+0.5)"`
- `"Remote role matches your work-style preference (+0.3)"`
- `"Salary $280k–$330k is well above your $200k floor (+0.5)"`
- `"Salary $120k–$150k is below your $200k floor (−0.5)"`
- `"Staff seniority matches your target (Staff/Principal) (+0.3)"`
- `"Junior seniority is 2 ranks below your target — likely too junior (−0.5)"`
- `"Posted 4 hours ago (+0.2)"`
- `"Posted 4 months ago — likely stale (−0.2)"`

## Testing

New file: `lib/discovery-scoring.test.ts` (or co-located). Cases:

1. **Each signal in isolation** — assemble a minimal context and assert the delta + reason string for each of the 13 signals above.
2. **Floor and cap** — a job with maximum bonuses (target company + full title + domain + competencies maxed + location + salary high + seniority match + remote match + new posting) is clamped to 5.0.
3. **A job with maximum penalties** — clamped to 1.0.
4. **Story domain union** — domain in `stories[*].domains` but absent from `prefs.domainsOfInterest` still scores.
5. **Story domain de-dup** — domain present in both contributes only once.
6. **Seniority parser**:
   - "Senior Product Manager" → 3
   - "Sr. Staff PM" → 4
   - "Group PM" → 5
   - "Director of Product" → 6
   - "Product Manager II" → 2 (numeric suffix ignored)
   - "VP, Product" → 7
7. **Work-style routing** — "Remote" location does NOT trigger location bonus; triggers work-style bonus instead. "Hybrid — Seattle" triggers both (work-style + location).
8. **Salary tiers** — three cases: max < floor (penalty), min ≥ floor < 120% (small bonus), min ≥ 120% floor (larger bonus).
9. **Empty prefs** — score equals 3.0 base with no reasons added.

## Risks and trade-offs

- **Many jobs hit the 5.0 ceiling.** Acceptable — those are genuine top matches. If discrimination at the top becomes a problem later, we can rebalance weights or introduce a separate "top-match" treatment in the UI.
- **Seniority parsing on quirky titles.** "Founding PM" doesn't parse — defaults to plain (rank 2). That's the correct semantic anyway.
- **Story tag noise.** If a user has loose story tags ("PM Skills", "Communication"), the competency bump might fire too often. Cap of +0.3 across all competency matches mitigates this.
- **Currency mismatch in salary.** `job.salary.currency` is not always USD. Initial implementation assumes USD; non-USD postings will mis-score until we add conversion. Note as known limitation.

## Out of scope (deferred)

- Anti-keyword / avoid list (needs new prefs UI)
- LLM scoring of top-N candidates (separate decision)
- Re-ranking pipeline jobs on prefs changes (currently only re-scores on add or content update)
- Multi-currency salary comparison
