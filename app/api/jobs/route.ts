import { NextResponse } from 'next/server';
import { getJobs, addJob, updateJob, saveJobs, getMasterResume, getProfile } from '@/lib/store';
import { scoreJobWithLLM } from '@/lib/scoring';
import { fetchJobDescription } from '@/lib/scanner';
import { mockLLM } from '@/lib/llm';

export async function GET() {
  return NextResponse.json(getJobs());
}

async function fetchAndScore(jobId: string, sourceUrl: string) {
  const resume = getMasterResume();
  const profile = getProfile();

  // Try to fetch the full job description from the ATS
  let content: string | undefined;
  try {
    const { description, unsupported } = await fetchJobDescription(sourceUrl);
    if (!unsupported && description) content = description;
  } catch { /* non-fatal */ }

  if (content) {
    updateJob(jobId, { content });
  }

  // Score with whatever content we have (full JD if fetched, title-only otherwise)
  const jobs = getJobs();
  const job = jobs.find(j => j.id === jobId);
  if (!job) return;

  const dimensions = await scoreJobWithLLM(job, resume, profile);
  updateJob(jobId, { dimensions, score: dimensions.overall, scoredAt: new Date().toISOString() });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { rawText, sourceUrl, company, title, location, salary, discoverScore } = body;

  let jobData: { company: string; title: string; location: string; salary: number; sourceUrl: string; content: string; score?: number };

  if (company && title) {
    jobData = {
      company, title,
      location: location || '',
      salary: typeof salary === 'number' ? salary : 0,
      sourceUrl: sourceUrl || '',
      content: title, // placeholder — fetchAndScore will replace this
      // Carry the discover score as the initial pipeline score so the user always
      // sees a meaningful number immediately. fetchAndScore will overwrite it with
      // the full LLM score once the JD is fetched.
      score: typeof discoverScore === 'number' ? discoverScore : undefined,
    };
  } else if (rawText) {
    try {
      const parsed = await mockLLM.parseJD(rawText);
      jobData = {
        company: parsed.company, title: parsed.title, location: parsed.location,
        salary: parsed.salary, sourceUrl: sourceUrl || '', content: rawText,
      };
    } catch (err) {
      console.error(err);
      return NextResponse.json({ error: 'Failed to parse JD' }, { status: 500 });
    }
  } else {
    return NextResponse.json({ error: 'Provide rawText or company+title' }, { status: 400 });
  }

  const newJob = addJob(jobData);

  if (company && title && sourceUrl) {
    // Fetch JD then score — both happen in one async chain so scoring uses the real JD
    fetchAndScore(newJob.id, sourceUrl).catch(console.error);
  } else {
    // Manual paste already has full content; score immediately
    const resume = getMasterResume();
    const profile = getProfile();
    scoreJobWithLLM(newJob, resume, profile).then(dimensions => {
      updateJob(newJob.id, { dimensions, score: dimensions.overall, scoredAt: new Date().toISOString() });
    }).catch(console.error);
  }

  return NextResponse.json(newJob);
}

export async function PUT(req: Request) {
  const { id, updates } = await req.json() as { id: string; updates: Partial<Parameters<typeof updateJob>[1]> };
  updateJob(id, updates);

  if (updates.content) {
    const jobs = getJobs();
    const job = jobs.find(j => j.id === id);
    if (job) {
      const resume = getMasterResume();
      const profile = getProfile();
      scoreJobWithLLM(job, resume, profile).then(dimensions => {
        updateJob(id, { dimensions, score: dimensions.overall, scoredAt: new Date().toISOString() });
      }).catch(console.error);
    }
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  const { id } = await req.json() as { id: string };
  saveJobs(getJobs().filter(j => j.id !== id));
  return NextResponse.json({ success: true });
}
