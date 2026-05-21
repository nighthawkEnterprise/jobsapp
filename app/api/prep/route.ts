import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import { getJobs, getStories } from '@/lib/store';
import { mockLLM } from '@/lib/llm';

export async function POST(req: Request) {
  const session = await auth0.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.sub as string;

  const { jobId } = await req.json();
  const [jobs, stories] = await Promise.all([getJobs(userId), getStories(userId)]);
  const job = jobs.find(j => j.id === jobId);

  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  if (stories.length === 0) return NextResponse.json({ error: 'No stories available' }, { status: 400 });

  try {
    const rawRankings = await mockLLM.prepInterview(job.content, stories.length);

    const populated = rawRankings.map(rs => {
      const story = stories[Math.min(rs.storyIndex, stories.length - 1)];
      return { story, reasoning: rs.reasoning };
    }).filter(item => item.story !== undefined);

    return NextResponse.json(populated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to generate prep' }, { status: 500 });
  }
}
