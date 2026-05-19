import { NextResponse } from 'next/server';
import { getJobs, getStories } from '@/lib/store';
import { mockLLM } from '@/lib/llm';

export async function POST(req: Request) {
  const { jobId } = await req.json();
  const [jobs, stories] = await Promise.all([getJobs(), getStories()]);
  const job = jobs.find(j => j.id === jobId);

  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  if (stories.length === 0) return NextResponse.json({ error: 'No stories available' }, { status: 400 });

  try {
    const rawRankings = await mockLLM.prepInterview(job.content, stories.length);
    
    // Map the returned mock indices to actual stories if we have enough of them
    const populated = rawRankings.map(rs => {
       const story = stories[Math.min(rs.storyIndex, stories.length - 1)];
       return {
         story,
         reasoning: rs.reasoning
       };
    }).filter(item => item.story !== undefined);

    return NextResponse.json(populated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to generate prep' }, { status: 500 });
  }
}
