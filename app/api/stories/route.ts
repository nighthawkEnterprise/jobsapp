import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import { getStories, addStory, updateStory, deleteStory } from '@/lib/store';

async function requireAuth() {
  const session = await auth0.getSession();
  if (!session) return null;
  return session.user.sub as string;
}

export async function GET() {
  const userId = await requireAuth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json(await getStories(userId));
}

export async function POST(req: Request) {
  const userId = await requireAuth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const story = await req.json();
  const newStory = await addStory(userId, story);
  return NextResponse.json(newStory);
}

export async function PUT(req: Request) {
  const userId = await requireAuth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id, updates } = await req.json();
  await updateStory(userId, id, updates);
  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  const userId = await requireAuth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  if (id) await deleteStory(userId, id);
  return NextResponse.json({ success: true });
}
