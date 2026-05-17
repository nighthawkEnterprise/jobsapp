import { NextResponse } from 'next/server';
import { getStories, addStory, updateStory, deleteStory } from '@/lib/store';

export async function GET() {
  return NextResponse.json(getStories());
}

export async function POST(req: Request) {
  const story = await req.json();
  const newStory = addStory(story);
  return NextResponse.json(newStory);
}

export async function PUT(req: Request) {
  const { id, updates } = await req.json();
  updateStory(id, updates);
  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  if (id) deleteStory(id);
  return NextResponse.json({ success: true });
}
