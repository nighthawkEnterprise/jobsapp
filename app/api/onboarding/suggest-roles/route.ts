import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import { getMasterResume } from '@/lib/store';
import Anthropic from '@anthropic-ai/sdk';
import { recordUsage } from '@/lib/usage';

const client = new Anthropic();

export async function POST() {
  const session = await auth0.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.sub as string;

  const resume = await getMasterResume(userId);
  if (!resume || resume.trim().length < 50) {
    return NextResponse.json({ suggestions: [] });
  }

  const truncated = resume.slice(0, 6000);

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 200,
    messages: [
      {
        role: 'user',
        content: `Based on this resume, suggest 4-6 specific job titles this person should target. Return ONLY a JSON array of strings, nothing else.

Resume:
${truncated}`,
      },
    ],
  });

  void recordUsage(userId, 'other', message.usage.input_tokens, message.usage.output_tokens);
  try {
    const text = message.content[0].type === 'text' ? message.content[0].text.trim() : '[]';
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    const suggestions: string[] = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    return NextResponse.json({ suggestions: suggestions.slice(0, 6) });
  } catch {
    return NextResponse.json({ suggestions: [] });
  }
}
