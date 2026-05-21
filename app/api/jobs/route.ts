import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import { getJobs, addJob, updateJob, deleteJob, getMasterResume, getProfile } from '@/lib/store';
import { scoreJobWithLLM } from '@/lib/scoring';
import { fetchJobDescription } from '@/lib/scanner';
import { mockLLM } from '@/lib/llm';

async function requireAuth() {
  const session = await auth0.getSession();
  if (!session) return null;
  return session.user.sub as string;
}

export async function GET() {
  const userId = await requireAuth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json(await getJobs(userId));
}

async function fetchAndScore(userId: string, jobId: string, sourceUrl: string) {
  const [resume, profile] = await Promise.all([getMasterResume(userId), getProfile(userId)]);

  let content: string | undefined;
  try {
    const { description, unsupported } = await fetchJobDescription(sourceUrl);
    if (!unsupported && description) content = description;
  } catch { /* non-fatal */ }

  if (content) await updateJob(userId, jobId, { content });

  const jobs = await getJobs(userId);
  const job = jobs.find(j => j.id === jobId);
  if (!job) return;

  const dimensions = await scoreJobWithLLM(job, resume, profile, userId);
  await updateJob(userId, jobId, { dimensions, score: dimensions.overall, scoredAt: new Date().toISOString() });
}

export async function POST(req: Request) {
  const userId = await requireAuth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { rawText, sourceUrl, company, title, location, salary, discoverScore } = body;

  let jobData: { company: string; title: string; location: string; salary: number; sourceUrl: string; content: string; score?: number };

  if (company && title) {
    jobData = {
      company, title,
      location: location || '',
      salary: typeof salary === 'number' ? salary : 0,
      sourceUrl: sourceUrl || '',
      content: title,
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

  const newJob = await addJob(userId, jobData);

  if (company && title && sourceUrl) {
    fetchAndScore(userId, newJob.id, sourceUrl).catch(console.error);
  } else {
    const [resume, profile] = await Promise.all([getMasterResume(userId), getProfile(userId)]);
    scoreJobWithLLM(newJob, resume, profile, userId).then(dimensions =>
      updateJob(userId, newJob.id, { dimensions, score: dimensions.overall, scoredAt: new Date().toISOString() })
    ).catch(console.error);
  }

  return NextResponse.json(newJob);
}

export async function PUT(req: Request) {
  const userId = await requireAuth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, updates } = await req.json() as { id: string; updates: Partial<Parameters<typeof updateJob>[2]> };
  await updateJob(userId, id, updates);

  if (updates.content) {
    const jobs = await getJobs(userId);
    const job = jobs.find(j => j.id === id);
    if (job) {
      const [resume, profile] = await Promise.all([getMasterResume(userId), getProfile(userId)]);
      scoreJobWithLLM(job, resume, profile, userId).then(dimensions =>
        updateJob(userId, id, { dimensions, score: dimensions.overall, scoredAt: new Date().toISOString() })
      ).catch(console.error);
    }
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  const userId = await requireAuth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await req.json() as { id: string };
  await deleteJob(userId, id);
  return NextResponse.json({ success: true });
}
