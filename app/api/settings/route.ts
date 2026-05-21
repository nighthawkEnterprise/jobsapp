import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import { getPreferences, savePreferences, getMasterResume, saveMasterResume, getProfile, saveProfile, defaultPreferences } from '@/lib/store';

async function requireAuth() {
  const session = await auth0.getSession();
  if (!session) return null;
  return session.user.sub as string;
}

export async function GET() {
  const userId = await requireAuth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [preferences, resume, profile] = await Promise.all([
    getPreferences(userId),
    getMasterResume(userId),
    getProfile(userId),
  ]);
  return NextResponse.json({ preferences, resume, profile });
}

export async function DELETE() {
  const userId = await requireAuth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await Promise.all([
      savePreferences(userId, defaultPreferences),
      saveMasterResume(userId, ''),
      saveProfile(userId, ''),
    ]);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const userId = await requireAuth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const data = await req.json();
  try {
    await Promise.all([
      data.preferences ? savePreferences(userId, data.preferences) : Promise.resolve(),
      data.resume !== undefined ? saveMasterResume(userId, data.resume) : Promise.resolve(),
      data.profile !== undefined ? saveProfile(userId, data.profile) : Promise.resolve(),
    ]);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
