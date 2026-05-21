import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import { getDismissedUrls, addDismissedUrl, removeDismissedUrl } from '@/lib/store';

async function requireAuth() {
  const session = await auth0.getSession();
  if (!session) return null;
  return session.user.sub as string;
}

export async function GET() {
  const userId = await requireAuth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json({ urls: [...await getDismissedUrls(userId)] });
}

export async function POST(req: Request) {
  const userId = await requireAuth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { url } = await req.json() as { url?: string };
  if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 });
  await addDismissedUrl(userId, url);
  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  const userId = await requireAuth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { url } = await req.json() as { url?: string };
  if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 });
  await removeDismissedUrl(userId, url);
  return NextResponse.json({ success: true });
}
