import { NextResponse } from 'next/server';
import { getPortals, savePortals, scanPortal, scanAllPortals } from '@/lib/scanner';
import { getPreferences, getJobs, getScanCache, saveScanCache, getDismissedUrls } from '@/lib/store';
import type { Portal, ScannedJob } from '@/lib/scanner';
import type { ScoredDiscovery, ScanCache, Preferences } from '@/lib/store';

// Known single-word abbreviations → expanded role name
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

// Returns [expandedFull, coreKeyword] for each pref title
function prefKeywords(prefs: Preferences): Array<{ full: string; core: string }> {
  return prefs.jobTitles.map(pt => {
    const full = expandTitle(pt);
    return { full, core: coreRole(full) };
  });
}

function isRelevantTitle(title: string, prefs: Preferences): boolean {
  if (prefs.jobTitles.length === 0) return true;
  // Expand abbreviations in the incoming title too (company may post "Senior PM" not "Senior Product Manager")
  const t = expandTitle(title);
  return prefKeywords(prefs).some(({ full, core }) =>
    t.includes(full) || (core.length > 3 && t.includes(core))
  );
}

// Discover scoring is 1–5 (rule-based; no JD available).
// Base 3.0 — all portals are already target companies, so neutral is "decent".
function scoreScanResult(job: ScannedJob, prefs: Preferences): { score: number; reasons: string[] } {
  let score = 3.0;
  const reasons: string[] = [];
  const expandedTitle = expandTitle(job.title);
  const keywords = prefKeywords(prefs);

  // Title match
  const matchedFull = keywords.find(({ full }) => expandedTitle.includes(full));
  const matchedCore = !matchedFull && keywords.find(({ core }) => core.length > 3 && expandedTitle.includes(core));

  if (matchedFull) {
    score += 1.0;
    reasons.push(`Title matches preferred role "${matchedFull.full}" (+1.0)`);
  } else if (matchedCore) {
    score += 0.5;
    reasons.push(`Title contains role keyword "${matchedCore.core}" (+0.5)`);
  }

  // Domain of interest match in title (e.g. "PM, Identity" gets a boost)
  if (prefs.domainsOfInterest.length > 0) {
    const matchedDomain = prefs.domainsOfInterest.find(d =>
      expandedTitle.includes(d.toLowerCase())
    );
    if (matchedDomain) {
      score += 0.3;
      reasons.push(`Title mentions domain of interest "${matchedDomain}" (+0.3)`);
    }
  }

  // Location match
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
  const { searchParams } = new URL(req.url);
  if (searchParams.get('cache') === 'true') {
    return NextResponse.json(getScanCache());
  }
  return NextResponse.json(getPortals());
}

export async function POST(req: Request) {
  const body = await req.json() as { action: string; portal?: Portal; company?: string };

  if (body.action === 'add') {
    if (!body.portal?.company || !body.portal?.careersUrl) {
      return NextResponse.json({ error: 'company and careersUrl are required' }, { status: 400 });
    }
    const portals = getPortals();
    portals.push(body.portal);
    savePortals(portals);
    return NextResponse.json({ success: true });
  }

  if (body.action === 'scan') {
    if (body.company) {
      const portal = getPortals().find(p => p.company === body.company);
      if (!portal) return NextResponse.json({ error: 'Portal not found' }, { status: 404 });
      return NextResponse.json(await scanPortal(portal));
    }
    return NextResponse.json(await scanAllPortals());
  }

  if (body.action === 'discover') {
    const prefs = getPreferences();
    const existingUrls = new Set(getJobs().map(j => j.sourceUrl));
    const dismissedUrls = getDismissedUrls();
    const excludedSet = new Set(prefs.companiesToExclude.map(c => c.toLowerCase()));
    const portals = getPortals();
    const encoder = new TextEncoder();

    const allDiscoveries: ScoredDiscovery[] = [];
    const allErrors: Array<{ company: string; error: string }> = [];

    const stream = new ReadableStream({
      async start(controller) {
        const send = (msg: object) =>
          controller.enqueue(encoder.encode(JSON.stringify(msg) + '\n'));

        // Fire all portal scans in parallel; stream each result as it arrives
        await Promise.all(portals.map(async portal => {
          const result = await scanPortal(portal);

          if (result.error) {
            allErrors.push({ company: result.company, error: result.error });
            send({ type: 'error', company: result.company, error: result.error });
            return;
          }
          if (excludedSet.has(result.company.toLowerCase())) return;

          for (const job of result.jobs) {
            if (!isRelevantTitle(job.title, prefs)) continue;
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

        // Persist sorted cache then signal done
        allDiscoveries.sort((a, b) => b.score - a.score);
        const scanCache: ScanCache = {
          scannedAt: new Date().toISOString(),
          discoveries: allDiscoveries,
          errors: allErrors,
        };
        saveScanCache(scanCache);
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
  const { company } = await req.json() as { company: string };
  savePortals(getPortals().filter(p => p.company !== company));
  return NextResponse.json({ success: true });
}
