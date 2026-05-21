import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import { getUsage } from '@/lib/usage';

export async function GET() {
  const session = await auth0.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const stats = await getUsage(session.user.sub as string);
  return NextResponse.json(stats);
}
