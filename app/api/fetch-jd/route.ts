import { NextResponse } from 'next/server';
import { fetchJobDescription } from '@/lib/scanner';

export async function POST(req: Request) {
  const { url } = await req.json() as { url: string };
  if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 });
  const result = await fetchJobDescription(url);
  return NextResponse.json(result);
}
