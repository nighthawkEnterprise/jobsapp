import { NextResponse } from 'next/server';
import { getJobs, addJob, updateJob, getPreferences } from '@/lib/store';
import { scoreJob } from '@/lib/scoring';
import { mockLLM } from '@/lib/llm';

export async function GET() {
  const jobs = getJobs();
  const prefs = getPreferences();
  
  const scoredJobs = jobs.map(job => {
    const { score, reasoning } = scoreJob(job, prefs);
    return { ...job, score, reasoning };
  });

  return NextResponse.json(scoredJobs);
}

// Simple JD Parsing via Mock LLM
export async function POST(req: Request) {
  const { rawText, sourceUrl } = await req.json();
  
  if (!rawText) return NextResponse.json({ error: 'No text provided' }, { status: 400 });

  try {
    const parsedData = await mockLLM.parseJD(rawText);
    
    const newJob = addJob({
      company: parsedData.company,
      title: parsedData.title,
      location: parsedData.location,
      salary: parsedData.salary,
      sourceUrl: sourceUrl || '',
      content: rawText,
    });

    return NextResponse.json(newJob);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to parse JD' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const { id, updates } = await req.json();
  updateJob(id, updates);
  return NextResponse.json({ success: true });
}
