import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import { getPortals, addPortal, deletePortal, scanPortal, getDirectoryPortals } from '@/lib/scanner';
import { getPreferences, getJobs, getScanCache, saveScanCache, getDismissedUrls, getStories } from '@/lib/store';
import type { Portal } from '@/lib/scanner';
import type { ScoredDiscovery, ScanCache } from '@/lib/store';
import { buildScoringContext, isRelevantTitle, scoreScanResult } from '@/lib/discovery-scoring';

async function requireAuth() {
  const session = await auth0.getSession();
  if (!session) return null;
  return session.user.sub as string;
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
    const [prefs, jobs, dismissedUrls, userPortals, directoryPortals, oldCache, stories] = await Promise.all([
      getPreferences(userId),
      getJobs(userId),
      getDismissedUrls(userId),
      getPortals(userId),
      getDirectoryPortals(),
      getScanCache(userId),
      getStories(userId),
    ]);
    const existingUrls = new Set(jobs.map(j => j.sourceUrl));
    const excludedSet = new Set(prefs.companiesToExclude.map(c => c.toLowerCase()));
    const scoringCtx = buildScoringContext(prefs, stories);
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
            const { score, reasons } = scoreScanResult(job, scoringCtx);
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
