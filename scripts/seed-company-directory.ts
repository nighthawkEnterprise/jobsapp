/**
 * Seed the company_directory table from real ATS sitemaps.
 *
 * Run:  npx tsx scripts/seed-company-directory.ts
 *
 * Reads SUPABASE_URL and SUPABASE_SERVICE_KEY from .env.local
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

// ── Load env ──────────────────────────────────────────────────────────────────
const envPath = resolve(process.cwd(), '.env.local');
const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => {
      const idx = l.indexOf('=');
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim().replace(/^["']|["']$/g, '')];
    })
);

const SUPABASE_URL = env.SUPABASE_URL;
const SUPABASE_KEY = env.SUPABASE_SERVICE_KEY;
const REST_HEADERS = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'resolution=merge-duplicates',
};

// ── Types ─────────────────────────────────────────────────────────────────────
type ATS = 'greenhouse' | 'ashby' | 'lever';
interface Company { name: string; slug: string; ats: ATS }

// ── Helpers ───────────────────────────────────────────────────────────────────

async function get(url: string, retries = 3): Promise<string | null> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; applyos-seeder/1.0)' },
        signal: AbortSignal.timeout(15_000),
      });
      if (res.ok) return res.text();
    } catch { /* ignore, retry */ }
    if (i < retries - 1) await sleep(1000 * (i + 1));
  }
  return null;
}

async function getJson(url: string): Promise<unknown> {
  const text = await get(url);
  if (!text) return null;
  try { return JSON.parse(text); } catch { return null; }
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

function parseLocUrls(xml: string): string[] {
  return [...xml.matchAll(/<loc>\s*(https?:\/\/[^\s<]+)\s*<\/loc>/gi)].map(m => m[1].trim());
}

/** Fetch a sitemap, following sitemap index files one level deep */
async function fetchSitemapUrls(url: string): Promise<string[]> {
  const xml = await get(url);
  console.log(`  [debug] ${url} → ${xml ? `${xml.length} bytes` : 'NULL'}`);
  if (xml) console.log(`  [debug] first 300 chars: ${xml.slice(0, 300).replace(/\s+/g, ' ')}`);
  if (!xml) return [];

  if (xml.includes('<sitemapindex')) {
    const subUrls = parseLocUrls(xml);
    const results: string[] = [];
    // Fetch sub-sitemaps in batches of 5
    for (let i = 0; i < subUrls.length; i += 5) {
      const batch = await Promise.all(
        subUrls.slice(i, i + 5).map(async u => {
          const sub = await get(u);
          return sub ? parseLocUrls(sub) : [];
        })
      );
      results.push(...batch.flat());
    }
    return results;
  }

  return parseLocUrls(xml);
}

/** Run fn on items with at most `concurrency` in flight */
async function pool<T>(items: T[], concurrency: number, fn: (item: T) => Promise<void>) {
  const queue = [...items];
  const workers = Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
    while (queue.length) await fn(queue.shift()!);
  });
  await Promise.all(workers);
}

function slugToName(slug: string) {
  return slug.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// ── Greenhouse ────────────────────────────────────────────────────────────────
async function getGreenhouseCompanies(): Promise<Company[]> {
  console.log('\n[Greenhouse] Fetching sitemap…');
  const allUrls = await fetchSitemapUrls('https://job-boards.greenhouse.io/sitemap.xml');

  // Keep only company root URLs (no trailing path segments = individual jobs)
  const slugs = [
    ...new Set(
      allUrls
        .map(u => u.match(/^https:\/\/job-boards\.greenhouse\.io\/([A-Za-z0-9_-]+)\/?$/)?.[1])
        .filter((s): s is string => !!s)
    ),
  ];
  console.log(`[Greenhouse] ${slugs.length} unique slugs found. Resolving names…`);

  const companies: Company[] = [];
  let done = 0;

  await pool(slugs, 20, async slug => {
    const data = await getJson(`https://boards-api.greenhouse.io/v1/boards/${slug}`) as any;
    const name: string = data?.name ?? slugToName(slug);
    companies.push({ name, slug, ats: 'greenhouse' });
    done++;
    if (done % 100 === 0) console.log(`[Greenhouse] ${done}/${slugs.length}`);
  });

  return companies;
}

// ── Lever ─────────────────────────────────────────────────────────────────────
async function getLeverCompanies(): Promise<Company[]> {
  console.log('\n[Lever] Fetching sitemap…');
  const allUrls = await fetchSitemapUrls('https://jobs.lever.co/sitemap.xml');

  const slugs = [
    ...new Set(
      allUrls
        .map(u => u.match(/^https:\/\/jobs\.lever\.co\/([A-Za-z0-9_-]+)\/?$/)?.[1])
        .filter((s): s is string => !!s)
    ),
  ];
  console.log(`[Lever] ${slugs.length} unique slugs found. Resolving names…`);

  const companies: Company[] = [];
  let done = 0;

  await pool(slugs, 20, async slug => {
    // First posting tells us the real company name
    const data = await getJson(
      `https://api.lever.co/v0/postings/${slug}?limit=1&mode=json`
    ) as any;
    const name: string = Array.isArray(data) && data[0]?.company
      ? data[0].company
      : slugToName(slug);
    companies.push({ name, slug, ats: 'lever' });
    done++;
    if (done % 100 === 0) console.log(`[Lever] ${done}/${slugs.length}`);
  });

  return companies;
}

// ── Ashby ─────────────────────────────────────────────────────────────────────
async function getAshbyCompanies(): Promise<Company[]> {
  console.log('\n[Ashby] Fetching sitemap…');
  const allUrls = await fetchSitemapUrls('https://jobs.ashbyhq.com/sitemap.xml');

  const slugs = [
    ...new Set(
      allUrls
        .map(u => u.match(/^https:\/\/jobs\.ashbyhq\.com\/([A-Za-z0-9_-]+)\/?$/)?.[1])
        .filter((s): s is string => !!s)
    ),
  ];
  console.log(`[Ashby] ${slugs.length} unique slugs. Using formatted slugs as names.`);

  // Ashby has no simple public company-name API; slug is usually the company name
  return slugs.map(slug => ({ name: slugToName(slug), slug, ats: 'ashby' as ATS }));
}

// ── Upsert via Supabase REST API (no WebSocket / Realtime needed) ─────────────
async function upsertBatch(companies: Company[]) {
  const url = `${SUPABASE_URL}/rest/v1/company_directory`;
  const CHUNK = 500;
  let total = 0;

  for (let i = 0; i < companies.length; i += CHUNK) {
    const chunk = companies.slice(i, i + CHUNK).map(({ name, slug, ats }) => ({ name, slug, ats }));
    const res = await fetch(url, {
      method: 'POST',
      headers: REST_HEADERS,
      body: JSON.stringify(chunk),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`\nUpsert error at offset ${i}: ${res.status} ${body.slice(0, 200)}`);
    } else {
      total += chunk.length;
    }
    process.stdout.write(`\rUpserted ${Math.min(i + CHUNK, companies.length)} / ${companies.length}`);
  }
  console.log(`\n✓ ${total} rows written`);
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('Starting company directory seeder…\n');

  const [gh, lever, ashby] = await Promise.all([
    getGreenhouseCompanies(),
    getLeverCompanies(),
    getAshbyCompanies(),
  ]);

  console.log(`\n── Summary ────────────────────────────────`);
  console.log(`Greenhouse : ${gh.length}`);
  console.log(`Lever      : ${lever.length}`);
  console.log(`Ashby      : ${ashby.length}`);
  console.log(`Total      : ${gh.length + lever.length + ashby.length}`);
  console.log(`───────────────────────────────────────────\n`);

  await upsertBatch([...gh, ...lever, ...ashby]);
  console.log('\nDone.');
}

main().catch(err => { console.error(err); process.exit(1); });
