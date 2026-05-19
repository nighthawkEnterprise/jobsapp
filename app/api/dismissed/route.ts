import { NextResponse } from 'next/server';
import { getDismissedUrls, addDismissedUrl, removeDismissedUrl } from '@/lib/store';

export async function GET() {
  return NextResponse.json({ urls: [...await getDismissedUrls()] });
}

export async function POST(req: Request) {
  const { url } = await req.json() as { url?: string };
  if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 });
  await addDismissedUrl(url);
  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  const { url } = await req.json() as { url?: string };
  if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 });
  await removeDismissedUrl(url);
  return NextResponse.json({ success: true });
}
