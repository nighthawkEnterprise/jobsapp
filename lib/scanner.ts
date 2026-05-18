import fs from 'fs';
import path from 'path';

export interface Portal {
  company: string;
  careersUrl: string;
  shard?: string; // Workday: wd1, wd3, wd5
  site?: string;  // Workday: site path segment
}

export interface JobSalary {
  min?: number;
  max?: number;
  currency?: string;
}

export interface ScannedJob {
  company: string;
  title: string;
  url: string;
  location: string;
  salary?: JobSalary;
  postedAt?: string; // ISO date string
}

export interface ScanResult {
  company: string;
  careersUrl: string;
  platform: string;
  jobs: ScannedJob[];
  error?: string;
}

type Platform = 'greenhouse' | 'ashby' | 'lever' | 'bamboohr' | 'teamtailor' | 'workday' | 'workable' | 'unknown';

const PORTALS_FILE = path.join(process.cwd(), 'data', 'portals.json');

export function getPortals(): Portal[] {
  if (!fs.existsSync(PORTALS_FILE)) return [];
  return JSON.parse(fs.readFileSync(PORTALS_FILE, 'utf8'));
}

export function savePortals(portals: Portal[]) {
  fs.writeFileSync(PORTALS_FILE, JSON.stringify(portals, null, 2));
}

function detectPlatform(url: string): Platform {
  if (url.includes('greenhouse.io')) return 'greenhouse';
  if (url.includes('ashbyhq.com')) return 'ashby';
  if (url.includes('lever.co')) return 'lever';
  if (url.includes('bamboohr.com')) return 'bamboohr';
  if (url.includes('teamtailor.com')) return 'teamtailor';
  if (url.includes('myworkdayjobs.com')) return 'workday';
  if (url.includes('workable.com')) return 'workable';
  return 'unknown';
}

function extractPathSlug(url: string): string {
  const parts = new URL(url).pathname.split('/').filter(Boolean);
  return parts[parts.length - 1] ?? '';
}

async function scanGreenhouse(company: string, url: string): Promise<ScannedJob[]> {
  const slug = extractPathSlug(url);
  const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${slug}/jobs`);
  if (!res.ok) throw new Error(`Greenhouse API ${res.status}`);
  const data = await res.json() as { jobs: Array<{ title: string; absolute_url: string; location?: { name?: string }; updated_at?: string }> };
  return (data.jobs ?? []).map(j => ({
    company,
    title: j.title,
    url: j.absolute_url,
    location: j.location?.name ?? '',
    postedAt: j.updated_at,
  }));
}

function parseSalaryText(text: string): JobSalary | undefined {
  // Pattern 1: "$213K – $251K", "$213,000 – $251,000", "$213k-$251k"
  const m1 = text.match(/\$\s*([\d,]+\.?\d*)\s*(k)?\s*[–\-]\s*\$\s*([\d,]+\.?\d*)\s*(k)?/i);
  if (m1) {
    const parse = (num: string, k?: string) => {
      const n = parseFloat(num.replace(/,/g, ''));
      return k ? n * 1000 : n;
    };
    const min = parse(m1[1], m1[2]);
    const max = parse(m1[3], m1[4]);
    if (min || max) return { min, max, currency: 'USD' };
  }

  // Pattern 2: "between $172,000 USD and $249,000 USD" (salary range in description prose)
  // Requires both values >= 10,000 to avoid matching revenue figures like "$400M ARR and..."
  const m2 = text.match(/\$\s*([\d,]+)\s*(USD|CAD|GBP|EUR)?\s+and\s+\$\s*([\d,]+)\s*(USD|CAD|GBP|EUR)?/i);
  if (m2) {
    const parse2 = (s: string) => parseFloat(s.replace(/,/g, ''));
    const min = parse2(m2[1]);
    const max = parse2(m2[3]);
    if (min >= 10000 && max >= 10000) {
      const currency = ((m2[2] ?? m2[4]) || 'USD').toUpperCase();
      return { min, max, currency };
    }
  }

  return undefined;
}

async function scanAshby(company: string, url: string): Promise<ScannedJob[]> {
  const slug = extractPathSlug(url);
  const res = await fetch(`https://api.ashbyhq.com/posting-api/job-board/${slug}?includeCompensation=true`);
  if (!res.ok) throw new Error(`Ashby API ${res.status}`);

  type AshbyCompComponent = { compensationType?: string; minValue?: number | null; maxValue?: number | null; currencyCode?: string | null };
  type AshbyJob = {
    title: string; jobUrl: string; location?: string; publishedAt?: string;
    descriptionPlain?: string | null;
    compensation?: {
      summaryComponents?: AshbyCompComponent[];
      scrapeableCompensationSalarySummary?: string | null;
    };
  };

  const data = await res.json() as { jobs: AshbyJob[] };
  return (data.jobs ?? []).map(j => {
    const comp = j.compensation;
    let salary: JobSalary | undefined;
    if (comp) {
      // Find Salary component by type — order varies across companies (equity may come first)
      const components = comp.summaryComponents ?? [];
      const c = components.find(x => x.compensationType === 'Salary') ?? components.find(x => x.minValue != null);
      const min = c?.minValue ?? undefined;
      const max = c?.maxValue ?? undefined;
      const currency = (c?.currencyCode ?? 'USD') || 'USD';
      if (min || max) {
        salary = { min: min ?? undefined, max: max ?? undefined, currency };
      } else if (comp.scrapeableCompensationSalarySummary) {
        salary = parseSalaryText(comp.scrapeableCompensationSalarySummary);
      }
    }
    // Last resort: parse salary from the plain-text description (e.g. 1Password embeds ranges in prose)
    if (!salary && j.descriptionPlain) {
      salary = parseSalaryText(j.descriptionPlain);
    }
    return { company, title: j.title, url: j.jobUrl, location: j.location ?? '', salary, postedAt: j.publishedAt };
  });
}

async function scanLever(company: string, url: string): Promise<ScannedJob[]> {
  const slug = extractPathSlug(url);
  const res = await fetch(`https://api.lever.co/v0/postings/${slug}`);
  if (!res.ok) throw new Error(`Lever API ${res.status}`);
  const data = await res.json() as Array<{ text: string; hostedUrl: string; applyUrl?: string; categories?: { location?: string }; createdAt?: number }>;
  return data.map(j => ({
    company,
    title: j.text,
    url: j.hostedUrl || j.applyUrl || '',
    location: j.categories?.location ?? '',
    postedAt: j.createdAt ? new Date(j.createdAt).toISOString() : undefined,
  }));
}

async function scanBambooHR(company: string, url: string): Promise<ScannedJob[]> {
  const subdomain = new URL(url).hostname.split('.')[0];
  const res = await fetch(`https://${subdomain}.bamboohr.com/careers/list`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`BambooHR API ${res.status}`);
  const data = await res.json() as { result: Array<{ jobOpeningName: string; id: string }> };
  return (data.result ?? []).map(j => ({
    company,
    title: j.jobOpeningName,
    url: `https://${subdomain}.bamboohr.com/careers/${j.id}`,
    location: '',
  }));
}

function parseRSS(xml: string): Array<{ title: string; link: string }> {
  const items: Array<{ title: string; link: string }> = [];
  for (const match of xml.matchAll(/<item[^>]*>([\s\S]*?)<\/item>/gi)) {
    const block = match[1];
    const titleMatch = block.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/i);
    const linkMatch = block.match(/<link>(.*?)<\/link>/i);
    if (titleMatch && linkMatch) {
      items.push({ title: titleMatch[1].trim(), link: linkMatch[1].trim() });
    }
  }
  return items;
}

async function scanTeamtailor(company: string, url: string): Promise<ScannedJob[]> {
  const subdomain = new URL(url).hostname.split('.')[0];
  const res = await fetch(`https://${subdomain}.teamtailor.com/jobs.rss`);
  if (!res.ok) throw new Error(`Teamtailor RSS ${res.status}`);
  const xml = await res.text();
  return parseRSS(xml).map(item => ({
    company,
    title: item.title,
    url: item.link,
    location: '',
  }));
}

async function scanWorkday(company: string, url: string, shard?: string, site?: string): Promise<ScannedJob[]> {
  const parsed = new URL(url);
  const hostParts = parsed.hostname.split('.');
  const companySlug = hostParts[0];
  const shardSlug = shard ?? hostParts[1];
  const siteSlug = site ?? parsed.pathname.split('/').filter(Boolean)[0];
  const baseUrl = `https://${companySlug}.${shardSlug}.myworkdayjobs.com`;
  const apiUrl = `${baseUrl}/wday/cxs/${companySlug}/${siteSlug}/jobs`;

  const jobs: ScannedJob[] = [];
  let offset = 0;
  const limit = 20;

  while (true) {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appliedFacets: {}, limit, offset, searchText: '' }),
    });
    if (!res.ok) throw new Error(`Workday API ${res.status}`);
    const data = await res.json() as { jobPostings: Array<{ title: string; externalPath: string }> };
    const postings = data.jobPostings ?? [];
    for (const j of postings) {
      jobs.push({ company, title: j.title, url: `${baseUrl}${j.externalPath}`, location: '' });
    }
    if (postings.length < limit) break;
    offset += limit;
  }
  return jobs;
}

export async function scanPortal(portal: Portal): Promise<ScanResult> {
  const { company, careersUrl } = portal;
  const platform = detectPlatform(careersUrl);
  try {
    let jobs: ScannedJob[];
    switch (platform) {
      case 'greenhouse': jobs = await scanGreenhouse(company, careersUrl); break;
      case 'ashby':      jobs = await scanAshby(company, careersUrl); break;
      case 'lever':      jobs = await scanLever(company, careersUrl); break;
      case 'bamboohr':   jobs = await scanBambooHR(company, careersUrl); break;
      case 'teamtailor': jobs = await scanTeamtailor(company, careersUrl); break;
      case 'workday':    jobs = await scanWorkday(company, careersUrl, portal.shard, portal.site); break;
      case 'workable':
        return { company, careersUrl, platform, jobs: [], error: 'Workable has no public API — use manual search' };
      default:
        return { company, careersUrl, platform, jobs: [], error: 'Unrecognized ATS platform' };
    }
    return { company, careersUrl, platform, jobs };
  } catch (err) {
    return { company, careersUrl, platform, jobs: [], error: (err as Error).message };
  }
}

export async function scanAllPortals(): Promise<ScanResult[]> {
  const portals = getPortals();
  return Promise.all(portals.map(scanPortal));
}

// --- Per-job description fetching ---

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim();
}

async function fetchGreenhouseDescription(jobUrl: string): Promise<string> {
  // URL shape: https://job-boards.greenhouse.io/{slug}/jobs/{id}
  const parts = new URL(jobUrl).pathname.split('/').filter(Boolean);
  const id = parts[parts.length - 1];
  const slug = parts[0];
  const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${slug}/jobs/${id}`);
  if (!res.ok) return '';
  const data = await res.json() as { content?: string };
  return stripHtml(data.content ?? '');
}

async function fetchLeverDescription(jobUrl: string): Promise<string> {
  // URL shape: https://jobs.lever.co/{slug}/{posting-id}
  const parts = new URL(jobUrl).pathname.split('/').filter(Boolean);
  const postingId = parts[parts.length - 1];
  const slug = parts[0];
  const res = await fetch(`https://api.lever.co/v0/postings/${slug}/${postingId}`);
  if (!res.ok) return '';
  const data = await res.json() as { descriptionPlain?: string; description?: string; lists?: Array<{ text: string; content: string }> };
  if (data.descriptionPlain) return data.descriptionPlain;
  const sections = (data.lists ?? []).map(l => `${l.text}\n${l.content}`).join('\n\n');
  return stripHtml((data.description ?? '') + '\n\n' + sections);
}

async function fetchAshbyDescription(jobUrl: string): Promise<string> {
  // URL shape: https://jobs.ashbyhq.com/{slug}/{posting-id}
  const parts = new URL(jobUrl).pathname.split('/').filter(Boolean);
  const postingId = parts[parts.length - 1];
  const slug = parts[0];

  // Primary: Ashby public posting REST API
  try {
    const rest = await fetch(`https://api.ashbyhq.com/posting-api/job-board/${slug}/job-posting/${postingId}`);
    if (rest.ok) {
      const data = await rest.json() as { jobPosting?: { descriptionHtml?: string } };
      const html = data.jobPosting?.descriptionHtml;
      if (html) return stripHtml(html);
    }
  } catch { /* fall through to GraphQL */ }

  // Fallback: internal GraphQL (note: resolver arg is jobPostingId, not id)
  const res = await fetch('https://jobs.ashbyhq.com/api/non-user-graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      operationName: 'ApiJobPosting',
      variables: { organizationHostedJobsPageName: slug, jobPostingId: postingId },
      query: `query ApiJobPosting($organizationHostedJobsPageName: String!, $jobPostingId: String!) {
        jobPosting(organizationHostedJobsPageName: $organizationHostedJobsPageName, jobPostingId: $jobPostingId) {
          descriptionHtml
        }
      }`,
    }),
  });
  if (!res.ok) return '';
  const data = await res.json() as { data?: { jobPosting?: { descriptionHtml?: string } } };
  return stripHtml(data.data?.jobPosting?.descriptionHtml ?? '');
}

const SUPPORTED_PLATFORMS = new Set<Platform>(['greenhouse', 'lever', 'ashby']);

export async function fetchJobDescription(jobUrl: string): Promise<{ description: string; unsupported: boolean }> {
  const platform = detectPlatform(jobUrl);
  if (!SUPPORTED_PLATFORMS.has(platform)) {
    return { description: '', unsupported: true };
  }
  try {
    let description = '';
    switch (platform) {
      case 'greenhouse': description = await fetchGreenhouseDescription(jobUrl); break;
      case 'lever':      description = await fetchLeverDescription(jobUrl); break;
      case 'ashby':      description = await fetchAshbyDescription(jobUrl); break;
    }
    return { description, unsupported: false };
  } catch {
    return { description: '', unsupported: false };
  }
}
