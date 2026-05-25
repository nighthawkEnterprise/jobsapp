import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import { getJobs, getMasterResume, getProfile, getStories, saveTailoredResume } from '@/lib/store';
import { buildTailorPrompt, parseTailorOutput, startTailorStream } from '@/lib/tailor';
import { recordUsage } from '@/lib/usage';

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

  let stream;
  try {
    const prompt = buildTailorPrompt(resume, profile, stories, job);
    stream = startTailorStream(prompt);
  } catch (error) {
    console.error('Tailor setup error:', error);
    return NextResponse.json({ error: 'Tailoring failed', detail: String(error) }, { status: 500 });
  }

  const encoder = new TextEncoder();
  let fullText = '';

  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      stream.on('text', (delta) => {
        fullText += delta;
        try {
          controller.enqueue(encoder.encode(delta));
        } catch {
          /* controller closed (client aborted) */
        }
      });

      try {
        const finalMessage = await stream.finalMessage();
        const parsed = parseTailorOutput(fullText);
        const id = buildId(resume, job.company, job.title);

        void saveTailoredResume(userId, id, `${id}.md`, parsed.tailoredResume);
        void recordUsage(userId, 'tailor', finalMessage.usage.input_tokens, finalMessage.usage.output_tokens);
      } catch (error) {
        console.error('Tailor stream error:', error);
        const msg = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
        try {
          controller.enqueue(encoder.encode(`\n[[STREAM_ERROR]]${msg}`));
        } catch { /* already closed */ }
      } finally {
        try { controller.close(); } catch { /* already closed */ }
      }
    },
    cancel() {
      stream.abort();
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
    },
  });
}
