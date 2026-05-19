import { NextResponse } from 'next/server';
import { getMasterResume } from '@/lib/store';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

export async function POST(req: Request) {
  const { stage, domains, priorities, dealbreakers } = await req.json();
  const resume = await getMasterResume();

  const resumeBlock = resume?.trim()
    ? `\nResume (first 3000 chars):\n${resume.slice(0, 3000)}`
    : '';

  const structuredBlock = [
    stage              && `Target company stage: ${stage}`,
    domains?.length    && `Domains of interest: ${domains.join(', ')}`,
    priorities?.length && `Optimizing for: ${priorities.join(', ')}`,
    dealbreakers?.length && `Dealbreakers: ${dealbreakers.join(', ')}`,
  ].filter(Boolean).join('\n');

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 400,
    messages: [
      {
        role: 'user',
        content: `Write a concise, first-person "North Star" statement (2–3 short paragraphs) for a job seeker's profile. It should describe:
1. The kind of role and company stage they're targeting
2. What they're optimizing for in their next move
3. Their dealbreakers

Be specific and direct. Do NOT use generic filler. Use "I" voice. Keep it under 200 words.

Inputs:
${structuredBlock}${resumeBlock}

Return only the North Star text, no preamble.`,
      },
    ],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text.trim() : '';
  return NextResponse.json({ northStar: text });
}
