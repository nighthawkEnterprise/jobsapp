import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { mockLLM } from '@/lib/llm';
import { getJobs } from '@/lib/store';

const OUTPUT_DIR = path.join(process.cwd(), 'output');

export async function POST(req: Request) {
  const { jobId } = await req.json();
  const job = getJobs().find(j => j.id === jobId);
  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

  try {
    const parsedResult = await mockLLM.tailorResume(job.content);

    if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${job.id}-tailored-${timestamp}.md`;
    fs.writeFileSync(path.join(OUTPUT_DIR, fileName), parsedResult.tailoredResume);

    return NextResponse.json(parsedResult);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Tailoring failed' }, { status: 500 });
  }
}
