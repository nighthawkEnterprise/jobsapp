import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import { getJobs, getMasterResume, getProfile, getStories, saveTailoredResume } from '@/lib/store';
import { tailorResumeWithLLM } from '@/lib/tailor';

function buildId(resume: string, company: string, title: string): string {
  const nameMatch = resume.match(/^#\s+(.+)$/m);
  const person = nameMatch ? nameMatch[1].trim() : 'Resume';
  const slug = (s: string) => s.replace(/[^a-zA-Z0-9]+/g, ' ').trim();
  return `${slug(person)} - ${slug(company)} - ${slug(title)}`;
}

export async function POST(req: Request) {
  const session = await auth0.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.sub as string;

  const { jobId } = await req.json() as { jobId: string };

  const [jobs, resume, profile, stories] = await Promise.all([
    getJobs(userId),
    getMasterResume(userId),
    getProfile(userId),
    getStories(userId),
  ]);

  const job = jobs.find(j => j.id === jobId);
  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

  try {
    const result = await tailorResumeWithLLM(job, resume, profile, stories, userId);

    const id = buildId(resume, job.company, job.title);
    await saveTailoredResume(userId, id, `${id}.md`, result.tailoredResume);

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Tailoring failed', detail: String(error) }, { status: 500 });
  }
}
