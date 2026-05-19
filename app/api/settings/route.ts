import { NextResponse } from 'next/server';
import { getPreferences, savePreferences, getMasterResume, saveMasterResume, getProfile, saveProfile } from '@/lib/store';

export async function GET() {
  const [preferences, resume, profile] = await Promise.all([
    getPreferences(),
    getMasterResume(),
    getProfile(),
  ]);
  return NextResponse.json({ preferences, resume, profile });
}

export async function POST(req: Request) {
  const data = await req.json();
  await Promise.all([
    data.preferences ? savePreferences(data.preferences) : Promise.resolve(),
    data.resume !== undefined ? saveMasterResume(data.resume) : Promise.resolve(),
    data.profile !== undefined ? saveProfile(data.profile) : Promise.resolve(),
  ]);
  return NextResponse.json({ success: true });
}
