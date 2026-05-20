import { supabase } from './supabase';

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

export async function getPortals(): Promise<Portal[]> {
  const { data } = await supabase.from('portals').select('*').order('company');
  if (!data) return [];
  return data.map(r => ({
    company: r.company as string,
    careersUrl: r.careers_url as string,
    shard: r.shard as string | undefined,
    site: r.site as string | undefined,
  }));
}

export async function savePortals(portals: Portal[]): Promise<void> {
  await supabase.from('portals').delete().neq('company', '');
  if (portals.length > 0) {
    await supabase.from('portals').insert(
      portals.map(p => ({ company: p.company, careers_url: p.careersUrl, shard: p.shard, site: p.site }))
    );
  }
}

export async function addPortal(portal: Portal): Promise<void> {
  await supabase.from('portals').upsert({
    company: portal.company,
    careers_url: portal.careersUrl,
    shard: portal.shard,
    site: portal.site,
  });
}

export async function deletePortal(company: string): Promise<void> {
  await supabase.from('portals').delete().eq('company', company);
}

export async function seedAllPortalsFromDirectory(): Promise<number> {
  const { data } = await supabase
    .from('company_directory')
    .select('name, careers_url');

  if (!data || data.length === 0) return 0;

  const rows = data.map(r => ({ company: r.name as string, careers_url: r.careers_url as string }));

  // Batch upsert in chunks to stay within Supabase request limits
  const CHUNK = 100;
  for (let i = 0; i < rows.length; i += CHUNK) {
    await supabase.from('portals').upsert(rows.slice(i, i + CHUNK));
  }

  return rows.length;
}

function detectPlatform(url: string): Platform {
  if (url.includes('greenhouse.io')) return 'greenhouse';
  if (url.includes('ashbyhq.com')) return 'ashby';
  if (url.includes('lever.co')) return 'lever';
  if (url.includes('bamboohr.com')) return 'bamboohr';
  if (url.includes('teamtailor.com')) return 'teamtailor';
  if (url.includes('myworkdayjobs.com')) return 'workday';
  if (url.includes('workable.com')) return 'workable';
  // Greenhouse on a custom domain uses gh_jid as a query param
  try { if (new URL(url).searchParams.has('gh_jid')) return 'greenhouse'; } catch {}
  return 'unknown';
}

function extractPathSlug(url: string): string {
  // Use first non-empty path segment — the company slug is always first in ATS board URLs.
  // Last-segment logic silently breaks when URLs end in /jobs or /postings.
  const parts = new URL(url).pathname.split('/').filter(Boolean);
  return parts[0] ?? '';
}

function extractGreenhouseSlug(url: string): string {
  const parsed = new URL(url);
  const host = parsed.hostname;
  // Company-subdomain format: notion.greenhouse.io — slug is the first subdomain label.
  if (host.endsWith('.greenhouse.io') &&
      host !== 'boards.greenhouse.io' &&
      host !== 'job-boards.greenhouse.io') {
    return host.split('.')[0];
  }
  return extractPathSlug(url);
}

async function scanGreenhouse(company: string, url: string): Promise<ScannedJob[]> {
  const slug = extractGreenhouseSlug(url);
  const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${slug}/jobs?content=true`);
  if (!res.ok) throw new Error(`Greenhouse API ${res.status}`);
  const data = await res.json() as { jobs: Array<{ title: string; absolute_url: string; location?: { name?: string }; updated_at?: string; content?: string }> };
  return (data.jobs ?? []).map(j => ({
    company,
    title: j.title,
    url: j.absolute_url,
    location: j.location?.name ?? '',
    postedAt: j.updated_at,
    salary: j.content ? parseSalaryText(stripHtml(j.content)) : undefined,
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
  type LeverPosting = {
    text: string; hostedUrl: string; applyUrl?: string;
    categories?: { location?: string }; createdAt?: number;
    salaryRange?: { min?: number; max?: number; currency?: string };
    additional?: string;
  };
  const data = await res.json() as LeverPosting[];
  return data.map(j => {
    let salary: JobSalary | undefined;
    if (j.salaryRange?.min || j.salaryRange?.max) {
      salary = { min: j.salaryRange!.min, max: j.salaryRange!.max, currency: j.salaryRange!.currency ?? 'USD' };
    } else if (j.additional) {
      salary = parseSalaryText(stripHtml(j.additional));
    }
    return {
      company,
      title: j.text,
      url: j.hostedUrl || j.applyUrl || '',
      location: j.categories?.location ?? '',
      postedAt: j.createdAt ? new Date(j.createdAt).toISOString() : undefined,
      salary,
    };
  });
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
  const portals = await getPortals();
  return Promise.all(portals.map(scanPortal));
}

// --- Per-job description fetching ---

function stripHtml(html: string): string {
  // Decode entity-encoded angle brackets before stripping tags so that
  // Greenhouse-style responses (&lt;div&gt;) are handled correctly.
  const decoded = html
    .replace(/&lt;/gi, '<').replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&#39;/gi, "'");
  return decoded.replace(/<[^>]+>/g, ' ').replace(/&[a-z0-9#]+;/gi, ' ').replace(/\s+/g, ' ').trim();
}

async function fetchGreenhouseDescription(jobUrl: string): Promise<string> {
  const parsed = new URL(jobUrl);
  let id: string;
  let slug: string;

  if (parsed.searchParams.has('gh_jid') && !parsed.hostname.includes('greenhouse.io')) {
    // Custom domain URL: https://company.com/careers/...?gh_jid=12345
    // The slug is derived from the company hostname, not the path.
    id = parsed.searchParams.get('gh_jid')!;
    slug = parsed.hostname.replace(/^www\./, '').split('.')[0];
  } else {
    // Standard Greenhouse URL: https://job-boards.greenhouse.io/{slug}/jobs/{id}
    // gh_jid may be present as a redundant param but the path is authoritative.
    const parts = parsed.pathname.split('/').filter(Boolean);
    id = parts[parts.length - 1];
    slug = parts[0];
  }

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
  const data = await res.json() as {
    openingPlain?: string;
    descriptionPlain?: string;
    descriptionBodyPlain?: string;
    description?: string;
    additionalPlain?: string;
    lists?: Array<{ text: string; content: string }>;
  };

  const sections: string[] = [];

  // Company/role opening (prefer openingPlain; fall back to descriptionPlain)
  const intro = data.openingPlain || data.descriptionPlain;
  if (intro) sections.push(intro);

  // Main role-specific description (separate from the generic company intro)
  if (data.descriptionBodyPlain) {
    sections.push(data.descriptionBodyPlain);
  } else if (data.description) {
    sections.push(stripHtml(data.description));
  }

  // Structured sections: responsibilities, requirements, benefits, etc.
  for (const list of data.lists ?? []) {
    sections.push(`${list.text}\n${stripHtml(list.content)}`);
  }

  // Compensation and additional info
  if (data.additionalPlain) sections.push(data.additionalPlain);

  return sections.filter(Boolean).join('\n\n');
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
