# ATS Platforms — Supported APIs

Reference for all Applicant Tracking Systems supported by the career-ops scanner (`scan.mjs` and `/career-ops scan`).

---

## Greenhouse

**Career page:** `https://job-boards.greenhouse.io/{slug}`
**EU variant:** `https://job-boards.eu.greenhouse.io/{slug}`
**API:** `https://boards-api.greenhouse.io/v1/boards/{slug}/jobs`

**Response shape:**
```json
{
  "jobs": [
    { "title": "...", "absolute_url": "...", "location": { "name": "..." } }
  ]
}
```

**Auto-detected when:** `careers_url` contains `job-boards.greenhouse.io` or an explicit `api:` field is set in `portals.yml`.

**Notes:** Most commonly used ATS in this project. EU boards use the same API endpoint — the slug differs per company.

---

## Ashby

**Career page:** `https://jobs.ashbyhq.com/{slug}`
**REST API:** `https://api.ashbyhq.com/posting-api/job-board/{slug}?includeCompensation=true`
**GraphQL API (agent mode):** POST `https://jobs.ashbyhq.com/api/non-user-graphql?op=ApiJobBoardWithTeams`

**REST response shape:**
```json
{
  "jobs": [
    { "title": "...", "jobUrl": "...", "location": "..." }
  ]
}
```

**GraphQL request (agent mode):**
```json
{
  "operationName": "ApiJobBoardWithTeams",
  "variables": { "organizationHostedJobsPageName": "{slug}" },
  "query": "{ jobBoardWithTeams { jobPostings { id title locationName employmentType compensationTierSummary } } }"
}
```

**Auto-detected when:** `careers_url` contains `jobs.ashbyhq.com`.

**Notes:** `scan.mjs` uses the REST API. The agent (`/career-ops scan`) uses the GraphQL endpoint for richer data.

---

## Lever

**Career page:** `https://jobs.lever.co/{slug}`
**API:** `https://api.lever.co/v0/postings/{slug}`

**Response shape:**
```json
[
  { "text": "...", "hostedUrl": "...", "applyUrl": "...", "categories": { "location": "..." } }
]
```

**Auto-detected when:** `careers_url` contains `jobs.lever.co`.

**Notes:** Returns a root-level array (not wrapped in an object). Use `hostedUrl` as the canonical URL; fall back to `applyUrl` if missing.

---

## BambooHR

**Career page:** `https://{company}.bamboohr.com/careers`
**List API:** `https://{company}.bamboohr.com/careers/list`
**Detail API:** `https://{company}.bamboohr.com/careers/{id}/detail`

**List response shape:**
```json
{
  "result": [
    { "jobOpeningName": "...", "id": "123" }
  ]
}
```

**Detail response shape:**
```json
{
  "result": {
    "jobOpening": {
      "jobOpeningName": "...",
      "description": "...",
      "datePosted": "...",
      "compensation": "...",
      "jobOpeningShareUrl": "..."
    }
  }
}
```

**Notes:** List endpoint only returns metadata. To get the full JD, fetch each detail endpoint individually. Use `jobOpeningShareUrl` as the public URL when available.

---

## Teamtailor

**Career page:** `https://{company}.teamtailor.com/jobs`
**RSS feed:** `https://{company}.teamtailor.com/jobs.rss`

**Response shape:** Standard RSS — each `<item>` has `<title>` and `<link>`.

**Notes:** No JSON API; the RSS feed is the structured data source. Common in Nordic/European companies.

---

## Workday

**Career page:** `https://{company}.{shard}.myworkdayjobs.com/{site}`
**API:** POST `https://{company}.{shard}.myworkdayjobs.com/wday/cxs/{company}/{site}/jobs`

**Request body:**
```json
{ "appliedFacets": {}, "limit": 20, "offset": 0, "searchText": "" }
```

**Response shape:**
```json
{
  "jobPostings": [
    { "title": "...", "externalPath": "/job/..." }
  ]
}
```

**Pagination:** Increment `offset` by `limit` until results are exhausted.

**Notes:** `shard` is typically `wd1`, `wd3`, or `wd5` — varies per company. Used by large enterprises (Mastercard, Salesforce, etc.).

---

## Workable

**Career page:** `https://apply.workable.com/{company}/`

**Notes:** No public API. Scanned via WebSearch (`site:apply.workable.com/{company}`) in agent mode. Examples in this project: Hugging Face, Semios.

---

## Platform Detection Summary

| Platform | Detected by |
|----------|-------------|
| Greenhouse | `job-boards.greenhouse.io` or `job-boards.eu.greenhouse.io` in URL, or explicit `api:` field |
| Ashby | `jobs.ashbyhq.com` in URL |
| Lever | `jobs.lever.co` in URL |
| BambooHR | `{company}.bamboohr.com` in URL |
| Teamtailor | `{company}.teamtailor.com` in URL |
| Workday | `{company}.myworkdayjobs.com` in URL |
| Workable | `apply.workable.com` in URL — WebSearch only |

---

## Not Supported (and why)

| Platform | Reason |
|----------|--------|
| **LinkedIn** | No public job API. Official API requires OAuth and is heavily restricted. |
| **Indeed** | Public API deprecated in 2023. Automated access blocked. |
| **Glassdoor** | API deprecated. Scraping blocked. |

For LinkedIn/Indeed, the recommended workflow is to set up job alert emails and paste URLs directly into `data/pipeline.md` for evaluation.
