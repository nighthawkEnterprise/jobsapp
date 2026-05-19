import { NextResponse } from 'next/server';
import { getMasterResume } from '@/lib/store';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

export async function POST() {
  const resume = await getMasterResume();
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

  try {
    const text = message.content[0].type === 'text' ? message.content[0].text.trim() : '[]';
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    const suggestions: string[] = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    return NextResponse.json({ suggestions: suggestions.slice(0, 6) });
  } catch {
    return NextResponse.json({ suggestions: [] });
  }
}
