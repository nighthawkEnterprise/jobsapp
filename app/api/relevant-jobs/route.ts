import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import { getJobs } from '@/lib/store';

export async function GET() {
  const session = await auth0.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json(await getJobs(session.user.sub as string));
}
