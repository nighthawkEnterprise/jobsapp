import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import Anthropic from '@anthropic-ai/sdk';
import { recordUsage } from '@/lib/usage';

const client = new Anthropic();

export async function POST(req: Request) {
  const session = await auth0.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.sub as string;

  const { domains } = await req.json() as { domains: string[] };
  if (!domains?.length) return NextResponse.json({ companies: [] });

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    messages: [{
      role: 'user',
      content: `A Product Manager is interested in these domains: ${domains.join(', ')}.

Suggest 10–14 specific tech companies where a PM with this focus would want to work. Prioritise companies known for building core products in these spaces — include a mix of large/public and high-growth private companies.

Return ONLY a JSON array of company name strings. No explanation, no markdown.`,
    }],
  });

  void recordUsage(userId, 'other', message.usage.input_tokens, message.usage.output_tokens);

  try {
    const text = message.content[0].type === 'text' ? message.content[0].text.trim() : '[]';
    const match = text.match(/\[[\s\S]*\]/);
    const companies: string[] = match ? JSON.parse(match[0]) : [];
    return NextResponse.json({ companies: companies.slice(0, 14) });
  } catch {
    return NextResponse.json({ companies: [] });
  }
}
