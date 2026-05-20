import { NextResponse } from 'next/server';
import { getPreferences, savePreferences, getMasterResume, saveMasterResume, getProfile, saveProfile, defaultPreferences } from '@/lib/store';

export async function GET() {
  const [preferences, resume, profile] = await Promise.all([
    getPreferences(),
    getMasterResume(),
    getProfile(),
  ]);
  return NextResponse.json({ preferences, resume, profile });
}

export async function DELETE() {
  try {
    await Promise.all([
      savePreferences(defaultPreferences),
      saveMasterResume(''),
      saveProfile(''),
    ]);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const data = await req.json();
  try {
    await Promise.all([
      data.preferences ? savePreferences(data.preferences) : Promise.resolve(),
      data.resume !== undefined ? saveMasterResume(data.resume) : Promise.resolve(),
      data.profile !== undefined ? saveProfile(data.profile) : Promise.resolve(),
    ]);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
