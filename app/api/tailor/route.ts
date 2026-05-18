import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getJobs, getMasterResume, getProfile, getStories } from '@/lib/store';
import { tailorResumeWithLLM } from '@/lib/tailor';

const OUTPUT_DIR = path.join(process.cwd(), 'output');

export async function POST(req: Request) {
  const { jobId } = await req.json() as { jobId: string };
  const job = getJobs().find(j => j.id === jobId);
  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

  const resume = getMasterResume();
  const profile = getProfile();
  const stories = getStories();

  try {
    const result = await tailorResumeWithLLM(job, resume, profile, stories);

    if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${job.id}-tailored-${timestamp}.md`;
    fs.writeFileSync(path.join(OUTPUT_DIR, fileName), result.tailoredResume);

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Tailoring failed', detail: String(error) }, { status: 500 });
  }
}
