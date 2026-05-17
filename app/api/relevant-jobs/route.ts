import { NextResponse } from 'next/server';
import { getJobs, getPreferences } from '@/lib/store';
import { scoreJob } from '@/lib/scoring';

export async function GET() {
  const jobs = getJobs();
  const prefs = getPreferences();
  
  const scoredJobs = jobs.map(job => {
    const { score, reasoning } = scoreJob(job, prefs);
    return { ...job, score, reasoning };
  });

  return NextResponse.json(scoredJobs);
}
