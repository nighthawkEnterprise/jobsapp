import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import { getPortals, addPortal, deletePortal, scanPortal, getDirectoryPortals } from '@/lib/scanner';
import { getPreferences, getJobs, getScanCache, saveScanCache, getDismissedUrls } from '@/lib/store';
import type { Portal, ScannedJob } from '@/lib/scanner';
import type { ScoredDiscovery, ScanCache, Preferences } from '@/lib/store';

async function requireAuth() {
  const session = await auth0.getSession();
  if (!session) return null;
  return session.user.sub as string;
}

const ABBREV: Record<string, string> = {
  pm:  'product manager',
  tpm: 'technical program manager',
  em:  'engineering manager',
  gm:  'general manager',
};

const SENIORITY = new Set([
  'senior', 'sr', 'staff', 'principal', 'lead', 'junior', 'jr',
  'associate', 'assoc', 'head', 'director', 'vp', 'vice', 'president', 'group',
]);

function expandTitle(title: string): string {
  return title.toLowerCase().split(/\s+/).map(w => ABBREV[w] ?? w).join(' ');
}

function coreRole(expanded: string): string {
  return expanded.split(/\s+/).filter(w => !SENIORITY.has(w)).join(' ');
}

function prefKeywords(prefs: Preferences): Array<{ full: string; core: string }> {
  return prefs.jobTitles.map(pt => {
    const full = expandTitle(pt);
    return { full, core: coreRole(full) };
  });
}

const ROLE_BASE_PHRASES = ['product manager', 'program manager', 'engineering manager', 'general manager'];

function isRelevantTitle(title: string, prefs: Preferences): boolean {
  if (prefs.jobTitles.length === 0) return true;
  const t = expandTitle(title);
  const tWords = new Set(t.split(/\W+/).filter(Boolean));
  return prefKeywords(prefs).some(({ full, core }) => {
    if (t.includes(full) || (core.length > 3 && t.includes(core))) return true;
    const prefWords = full.split(/\W+/).filter(Boolean);
    if (!prefWords.every(w => tWords.has(w))) return false;
    return ROLE_BASE_PHRASES.some(phrase => full.includes(phrase) && t.includes(phrase));
  });
}

function scoreScanResult(job: ScannedJob, prefs: Preferences): { score: number; reasons: string[] } {
  let score = 3.0;
  const reasons: string[] = [];
  const expandedTitle = expandTitle(job.title);
  const keywords = prefKeywords(prefs);

  const targetSet = new Set(prefs.targetCompanies.map(c => c.toLowerCase()));
  if (targetSet.has(job.company.toLowerCase())) {
    score += 1.0;
    reasons.push(`"${job.company}" is one of your target companies (+1.0)`);
  }

  const matchedFull = keywords.find(({ full }) => expandedTitle.includes(full));
  const matchedCore = !matchedFull && keywords.find(({ core }) => core.length > 3 && expandedTitle.includes(core));

  if (matchedFull) {
    score += 1.0;
    reasons.push(`Title matches preferred role "${matchedFull.full}" (+1.0)`);
  } else if (matchedCore) {
    score += 0.5;
    reasons.push(`Title contains role keyword "${matchedCore.core}" (+0.5)`);
  }

  if (prefs.domainsOfInterest.length > 0) {
    const matchedDomain = prefs.domainsOfInterest.find(d => expandedTitle.includes(d.toLowerCase()));
    if (matchedDomain) {
      score += 0.3;
      reasons.push(`Title mentions domain of interest "${matchedDomain}" (+0.3)`);
    }
  }

  if (job.location) {
    const matchedLoc = prefs.locationPreferences.find(loc =>
      job.location.toLowerCase().includes(loc.toLowerCase()) ||
      (loc.toLowerCase() === 'remote' && job.location.toLowerCase().includes('remote'))
    );
    if (matchedLoc) {
      score += 0.5;
      reasons.push(`Location "${job.location}" matches preference "${matchedLoc}" (+0.5)`);
    } else {
      reasons.push(`Location "${job.location}" doesn't match your preferences (${prefs.locationPreferences.join(', ')}) (±0)`);
    }
  } else {
    score += 0.1;
    reasons.push('Location not listed — benefit of the doubt (+0.1)');
  }

  return { score: Math.min(Math.round(score * 10) / 10, 5.0), reasons };
}

export async function GET(req: Request) {
  const userId = await requireAuth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  if (searchParams.get('cache') === 'true') {
    return NextResponse.json(await getScanCache(userId));
  }
  return NextResponse.json(await getPortals(userId));
}

export async function POST(req: Request) {
  const userId = await requireAuth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as { action: string; portal?: Portal; company?: string };

  if (body.action === 'add') {
    if (!body.portal?.company || !body.portal?.careersUrl) {
      return NextResponse.json({ error: 'company and careersUrl are required' }, { status: 400 });
    }
    await addPortal(userId, body.portal);
    return NextResponse.json({ success: true });
  }

  if (body.action === 'scan') {
    if (body.company) {
      const portals = await getPortals(userId);
      const portal = portals.find(p => p.company === body.company);
      if (!portal) return NextResponse.json({ error: 'Portal not found' }, { status: 404 });
      return NextResponse.json(await scanPortal(portal));
    }
    const portals = await getPortals(userId);
    return NextResponse.json(await Promise.all(portals.map(scanPortal)));
  }

  if (body.action === 'discover') {
    const [prefs, jobs, dismissedUrls, userPortals, directoryPortals, oldCache] = await Promise.all([
      getPreferences(userId),
      getJobs(userId),
      getDismissedUrls(userId),
      getPortals(userId),
      getDirectoryPortals(),
      getScanCache(userId),
    ]);
    const existingUrls = new Set(jobs.map(j => j.sourceUrl));
    const excludedSet = new Set(prefs.companiesToExclude.map(c => c.toLowerCase()));
    const encoder = new TextEncoder();

    // Scan pool = union of the user's curated portals + the global company directory.
    // User entries win on company-name collision so a custom careersUrl override is respected.
    const byCompany = new Map<string, Portal>();
    for (const p of directoryPortals) byCompany.set(p.company.toLowerCase(), p);
    for (const p of userPortals)      byCompany.set(p.company.toLowerCase(), p);
    const effectivePortals = Array.from(byCompany.values());

    const prevFailed404 = new Set(
      (oldCache?.errors ?? [])
        .filter(e => e.error.includes('404'))
        .map(e => e.company)
    );

    const allDiscoveries: ScoredDiscovery[] = [];
    const allErrors: Array<{ company: string; error: string }> = [];
    const seenUrls = new Set<string>();

    const stream = new ReadableStream({
      async start(controller) {
        const send = (msg: object) =>
          controller.enqueue(encoder.encode(JSON.stringify(msg) + '\n'));

        await Promise.all(effectivePortals.map(async portal => {
          const result = await scanPortal(portal);

          if (result.error) {
            const is404 = result.error.includes('404');
            if (is404) {
              if (prevFailed404.has(result.company)) {
                deletePortal(userId, result.company).catch(() => {});
              } else {
                allErrors.push({ company: result.company, error: result.error });
              }
            } else {
              allErrors.push({ company: result.company, error: result.error });
              send({ type: 'error', company: result.company, error: result.error });
            }
            return;
          }
          if (excludedSet.has(result.company.toLowerCase())) return;

          for (const job of result.jobs) {
            if (!isRelevantTitle(job.title, prefs)) continue;
            if (seenUrls.has(job.url)) continue;
            seenUrls.add(job.url);
            const { score, reasons } = scoreScanResult(job, prefs);
            const discovery: ScoredDiscovery = {
              company: job.company, title: job.title, url: job.url,
              location: job.location, score, scoreReasons: reasons,
              alreadyTracked: existingUrls.has(job.url),
              dismissed: dismissedUrls.has(job.url),
              salary: job.salary, postedAt: job.postedAt,
            };
            allDiscoveries.push(discovery);
            send({ type: 'job', job: discovery });
          }
        }));

        allDiscoveries.sort((a, b) => b.score - a.score);
        const scanCache: ScanCache = {
          scannedAt: new Date().toISOString(),
          discoveries: allDiscoveries,
          errors: allErrors,
        };
        await saveScanCache(userId, scanCache);
        send({ type: 'done', scannedAt: scanCache.scannedAt });
        controller.close();
      },
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'application/x-ndjson', 'Cache-Control': 'no-cache' },
    });
  }

  return NextResponse.json({ error: 'action must be "add", "scan", or "discover"' }, { status: 400 });
}

export async function DELETE(req: Request) {
  const userId = await requireAuth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { company } = await req.json() as { company: string };
  await deletePortal(userId, company);
  return NextResponse.json({ success: true });
}
