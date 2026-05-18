import { NextResponse } from 'next/server';
import { getPreferences, savePreferences, getMasterResume, saveMasterResume, getProfile, saveProfile } from '@/lib/store';

export async function GET() {
  return NextResponse.json({
    preferences: getPreferences(),
    resume: getMasterResume(),
    profile: getProfile(),
  });
}

export async function POST(req: Request) {
  const data = await req.json();
  if (data.preferences) savePreferences(data.preferences);
  if (data.resume !== undefined) saveMasterResume(data.resume);
  if (data.profile !== undefined) saveProfile(data.profile);
  return NextResponse.json({ success: true });
}
